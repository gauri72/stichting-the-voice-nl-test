import crypto from "crypto";
import mongoose from "mongoose";
import env from "../config/env.js";
import { getPlan, MEMBERSHIP_PLANS } from "../config/membershipPlans.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import Event from "../models/Event.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import PastData from "../models/PastData.js";
import { buildMembershipId } from "../utils/membershipId.js";
import { buildMembershipReceiptNumber } from "../utils/membershipReceiptNumber.js";
import { buildMembershipQrImageUrl } from "./membershipQrService.js";
import {
  buildMembershipEmailPayload,
} from "./membershipProvisioningService.js";
import { sendMembershipEmails } from "./membershipMailer.js";
import { renderMembershipReceiptPdf } from "./membershipReceiptPdf.js";
import { formatMoney } from "./ticketPricingService.js";
import { logAdminAction, getAuditLogsForTarget } from "./adminAuditService.js";
import { getTicketTailorStats } from "./ticketTailorBookingSyncService.js";
import { inferPlanIdFromTitle } from "./membershipService.js";

const EXPIRING_SOON_DAYS = 30;

export const MEMBERSHIP_TYPE_OPTIONS = [
  { id: "student", label: "Student" },
  { id: "privilegedSingle", label: "Privileged Single" },
  { id: "privilegedFamily", label: "Privileged Family" },
  { id: "premiumSingle", label: "Premium Single" },
  { id: "premiumFamily", label: "Premium Family" },
  { id: "custom", label: "Custom" },
];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatDateGb(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return "—";
  }
}

function daysUntil(date) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function computeDisplayStatus(member) {
  if (!member) return "expired";
  if (member.membershipStatus === "cancelled") return "cancelled";
  if (member.membershipStatus === "pending_payment" || member.paymentStatus === "pending") {
    return "pending_payment";
  }
  const expiry = member.expiryDate ? new Date(member.expiryDate) : null;
  if (member.membershipStatus === "expired" || (expiry && expiry < new Date())) return "expired";
  const days = daysUntil(expiry);
  if (days !== null && days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

function qrStatus(member) {
  if (!member?.verificationToken) return "missing";
  if (member.membershipStatus === "cancelled") return "inactive";
  const status = computeDisplayStatus(member);
  if (status === "expired") return "expired";
  return "valid";
}

function buildMemberQuery(filters = {}) {
  const query = {};
  if (filters.membershipType) {
    if (filters.membershipType === "custom") {
      query.planId = { $nin: Object.keys(MEMBERSHIP_PLANS) };
    } else {
      query.planId = filters.membershipType;
    }
  }
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.country) query.country = new RegExp(filters.country, "i");
  if (filters.autoRenewal === "true") query.autoRenewal = true;
  if (filters.autoRenewal === "false") query.autoRenewal = false;
  if (filters.createdFrom || filters.createdTo) {
    query.createdAt = {};
    if (filters.createdFrom) query.createdAt.$gte = new Date(filters.createdFrom);
    if (filters.createdTo) query.createdAt.$lte = new Date(filters.createdTo);
  }
  if (filters.expiryFrom || filters.expiryTo) {
    query.expiryDate = {};
    if (filters.expiryFrom) query.expiryDate.$gte = new Date(filters.expiryFrom);
    if (filters.expiryTo) query.expiryDate.$lte = new Date(filters.expiryTo);
  }
  if (filters.search) {
    const s = filters.search.trim();
    const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { membershipId: rx },
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { phone: rx },
    ];
  }
  return query;
}

async function aggregateEngagementForEmails(emails) {
  const normalized = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (!normalized.length) return new Map();

  const now = new Date();
  const [platformTickets, ttBookings, futureEvents] = await Promise.all([
    Ticket.find({ attendeeEmail: { $in: normalized } })
      .select("attendeeEmail checkedIn eventId createdAt")
      .lean(),
    TicketTailorBooking.find({ email: { $in: normalized } })
      .select("email checkedIn eventDate eventName bookingDate amountPaidMinor")
      .lean(),
    Event.find({ date: { $gte: now }, status: "published" }).select("_id date title").lean(),
  ]);

  const futureEventIds = new Set(futureEvents.map((e) => String(e._id)));
  const map = new Map();

  for (const email of normalized) {
    map.set(email, {
      eventsAttended: 0,
      upcomingEvents: 0,
      lastEventAttended: null,
      ticketSpendMinor: 0,
    });
  }

  for (const t of platformTickets) {
    const e = map.get(normalizeEmail(t.attendeeEmail));
    if (!e) continue;
    if (t.checkedIn) e.eventsAttended += 1;
    if (futureEventIds.has(String(t.eventId))) e.upcomingEvents += 1;
  }

  for (const b of ttBookings) {
    const e = map.get(normalizeEmail(b.email));
    if (!e) continue;
    e.ticketSpendMinor += b.amountPaidMinor || 0;
    if (b.checkedIn) {
      e.eventsAttended += 1;
      const d = b.eventDate || b.bookingDate;
      if (d && (!e.lastEventAttended || new Date(d) > new Date(e.lastEventAttended))) {
        e.lastEventAttended = d;
      }
    }
  }

  return map;
}

function parseTicketTailorDateField(value) {
  if (!value) return null;
  if (typeof value === "object" && value.iso) return new Date(value.iso);
  if (typeof value === "object" && value.unix) return new Date(value.unix * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeTicketTailorDisplayStatus(issued) {
  const voidedAt = parseTicketTailorDateField(issued?.voided_at);
  const isValid =
    issued?.is_valid === true || String(issued?.is_valid || "").toLowerCase() === "true";
  const validTo = parseTicketTailorDateField(issued?.valid_to);
  if (voidedAt || !isValid) return "cancelled";
  if (validTo && validTo < new Date()) return "expired";
  const days = daysUntil(validTo);
  if (days !== null && days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

function formatTicketTailorMemberSummary(email, issued, engagement = {}) {
  const validFrom = parseTicketTailorDateField(issued?.valid_from || issued?.issue_date);
  const validTo = parseTicketTailorDateField(issued?.valid_to);
  const membershipCode = String(issued?.code || issued?.id || "").trim();
  const membershipTypeName = String(issued?.membership_type_name || "Membership").trim();
  const planId = inferPlanIdFromTitle(membershipTypeName);
  const displayStatus = computeTicketTailorDisplayStatus(issued);
  const localPart = String(email || "").split("@")[0] || "Member";
  const nameParts = localPart.replace(/[._+-]/g, " ").split(/\s+/).filter(Boolean);

  return {
    id: `tt:${issued?.id}`,
    membershipId: membershipCode || `TT-${issued?.id}`,
    firstName: nameParts[0] || "TicketTailor",
    lastName: nameParts.slice(1).join(" "),
    fullName: nameParts.join(" ") || email,
    email,
    phone: "",
    country: "",
    membershipType: membershipTypeName,
    planId,
    membershipStatus: displayStatus,
    storedStatus: displayStatus,
    memberSince: validFrom,
    memberUntil: validTo,
    memberSinceLabel: formatDateGb(validFrom),
    memberUntilLabel: formatDateGb(validTo),
    paymentStatus: "paid",
    autoRenewal: false,
    qrStatus: "ticket_tailor",
    qrCodeUrl: "",
    eventsAttended: engagement.eventsAttended || 0,
    upcomingEvents: engagement.upcomingEvents || 0,
    lastEventAttended: engagement.lastEventAttended || null,
    lastEventAttendedLabel: engagement.lastEventAttended
      ? formatDateGb(engagement.lastEventAttended)
      : "—",
    amountPaid: "—",
    source: "ticket_tailor",
    readOnly: true,
    ticketTailorIssuedId: String(issued?.id || ""),
    createdAt: validFrom,
    updatedAt: validTo,
  };
}

async function loadTicketTailorMembershipRows({ platformEmails = new Set(), filters = {} } = {}) {
  const docs = await PastData.find({ issuedMembershipCount: { $gt: 0 } }).lean();
  const rows = [];

  for (const doc of docs) {
    const email = normalizeEmail(doc.email);
    if (!email) continue;
    if (platformEmails.has(email)) continue;

    for (const issued of doc.issuedMemberships || []) {
      if (!issued?.id) continue;
      const row = formatTicketTailorMemberSummary(email, issued);
      if (filters.membershipStatus && row.membershipStatus !== filters.membershipStatus) continue;
      if (filters.membershipType && row.planId !== filters.membershipType) continue;
      if (filters.search) {
        const s = filters.search.trim().toLowerCase();
        const haystack = `${row.membershipId} ${row.fullName} ${row.email} ${row.membershipType}`.toLowerCase();
        if (!haystack.includes(s)) continue;
      }
      rows.push(row);
    }
  }

  return rows;
}

async function getTicketTailorMembershipDetail(issuedId) {
  const docs = await PastData.find({ issuedMembershipCount: { $gt: 0 } }).lean();
  let match = null;
  let email = "";

  for (const doc of docs) {
    for (const issued of doc.issuedMemberships || []) {
      if (String(issued?.id) === String(issuedId)) {
        match = issued;
        email = normalizeEmail(doc.email);
        break;
      }
    }
    if (match) break;
  }

  if (!match) {
    const err = new Error("TicketTailor membership not found. Run Sync TT to refresh data.");
    err.status = 404;
    throw err;
  }

  const engagement = await aggregateEngagementForEmails([email]).then((m) => m.get(email) || {});
  const member = formatTicketTailorMemberSummary(email, match, engagement);
  const [eventParticipation, ttBookings] = await Promise.all([
    buildEventParticipation(email),
    TicketTailorBooking.find({ email }).sort({ bookingDate: -1 }).lean(),
  ]);

  return {
    member,
    user: null,
    dashboardMembership: null,
    summary: {
      totalEventsAttended: engagement.eventsAttended || 0,
      upcomingEvents: engagement.upcomingEvents || 0,
      totalTicketsPurchased: ttBookings.length,
      lifetimeTicketSpend: formatMoney(engagement.ticketSpendMinor || 0),
      lifetimeTicketSpendMinor: engagement.ticketSpendMinor || 0,
      discountsUsed: 0,
      membershipSavings: formatMoney(0),
      membershipSavingsMinor: 0,
    },
    eventParticipation,
    ticketTailorActivity: ttBookings.map((b) => ({
      id: b._id.toString(),
      eventName: b.eventName,
      eventDate: b.eventDate,
      eventDateLabel: formatDateGb(b.eventDate),
      ticketType: b.ticketType,
      quantity: b.quantity,
      orderNumber: b.ticketTailorOrderId,
      ticketTailorOrderId: b.ticketTailorOrderId,
      bookingStatus: b.bookingStatus,
      checkInStatus: b.checkedIn ? "checked_in" : "not_checked_in",
      amountPaid: formatMoney(b.amountPaidMinor),
      bookingDate: b.bookingDate,
      bookingDateLabel: formatDateGb(b.bookingDate),
      isMember: Boolean(b.memberId),
    })),
    payments: [],
    discounts: { voucherCodesUsed: [], membershipDiscountsUsed: 0, totalSavings: formatMoney(0) },
    notes: "Managed in TicketTailor. Platform actions (renew, QR, email) are not available for imported records.",
    timeline: [
      {
        type: "tickettailor_membership",
        date: parseTicketTailorDateField(match.issue_date || match.valid_from) || new Date(),
        summary: `TicketTailor membership issued — ${member.membershipType}`,
      },
      ...ttBookings.map((b) => ({
        type: "tickettailor_booking",
        date: b.bookingDate,
        summary: `TicketTailor booking — ${b.eventName}`,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)),
    ticketTailorIssued: match,
  };
}

export function formatMemberSummary(member, engagement = {}, meta = {}) {
  const displayStatus = computeDisplayStatus(member);
  return {
    id: member._id?.toString() || member.id,
    membershipId: member.membershipId,
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`.trim(),
    email: member.email,
    phone: member.phone || "",
    country: member.country || "",
    membershipType: member.membershipType,
    planId: member.planId,
    membershipStatus: displayStatus,
    storedStatus: member.membershipStatus,
    memberSince: member.startDate,
    memberUntil: member.expiryDate,
    memberSinceLabel: formatDateGb(member.startDate),
    memberUntilLabel: formatDateGb(member.expiryDate),
    paymentStatus: member.paymentStatus || "paid",
    autoRenewal: Boolean(member.autoRenewal),
    qrStatus: qrStatus(member),
    qrCodeUrl: member.qrCodeUrl,
    eventsAttended: engagement.eventsAttended || 0,
    upcomingEvents: engagement.upcomingEvents || 0,
    lastEventAttended: engagement.lastEventAttended || null,
    lastEventAttendedLabel: engagement.lastEventAttended
      ? formatDateGb(engagement.lastEventAttended)
      : "—",
    amountPaid: formatMoney(member.amountPaidMinor),
    source: meta.source || "platform",
    readOnly: false,
    ticketTailorIssuedId: null,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export async function getMembershipStats() {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalMemberships,
    activeCount,
    expiringSoon,
    expiredCount,
    revenueAgg,
    renewalsThisMonth,
    ttStats,
    members,
  ] = await Promise.all([
    Member.countDocuments({}),
    Member.countDocuments({
      membershipStatus: "active",
      expiryDate: { $gte: now },
    }),
    Member.countDocuments({
      membershipStatus: "active",
      expiryDate: { $gte: now, $lte: soon },
    }),
    Member.countDocuments({
      $or: [{ membershipStatus: "expired" }, { expiryDate: { $lt: now } }],
    }),
    Member.aggregate([{ $group: { _id: null, total: { $sum: "$amountPaidMinor" } } }]),
    Member.countDocuments({ createdAt: { $gte: startOfMonth } }),
    getTicketTailorStats(),
    Member.find({ membershipStatus: "active", expiryDate: { $gte: now } })
      .select("email")
      .lean(),
  ]);

  const activeEmails = members.map((m) => normalizeEmail(m.email));
  const engagement = await aggregateEngagementForEmails(activeEmails);
  let attendingUpcoming = 0;
  for (const email of activeEmails) {
    if ((engagement.get(email)?.upcomingEvents || 0) > 0) attendingUpcoming += 1;
  }

  const platformEmailSet = new Set(
    (await Member.find({}).select("email").lean()).map((m) => normalizeEmail(m.email))
  );
  const ttMembershipRows = await loadTicketTailorMembershipRows({ platformEmails: platformEmailSet });
  const ttActive = ttMembershipRows.filter((r) => r.membershipStatus === "active").length;
  const ttExpiring = ttMembershipRows.filter((r) => r.membershipStatus === "expiring_soon").length;
  const ttExpired = ttMembershipRows.filter((r) =>
    ["expired", "cancelled"].includes(r.membershipStatus)
  ).length;

  return {
    totalMemberships: totalMemberships + ttMembershipRows.length,
    activeMemberships: activeCount + ttActive,
    expiringSoon: expiringSoon + ttExpiring,
    expiredMemberships: expiredCount + ttExpired,
    platformMemberships: totalMemberships,
    ticketTailorMemberships: ttMembershipRows.length,
    membershipRevenue: formatMoney(revenueAgg[0]?.total || 0),
    membershipRevenueMinor: revenueAgg[0]?.total || 0,
    renewalsThisMonth,
    membersAttendingUpcomingEvents: attendingUpcoming,
    ticketTailorTicketsPurchased: ttStats.totalBookings,
    ticketTailorRevenue: formatMoney(ttStats.totalRevenueMinor),
    ticketTailorRevenueMinor: ttStats.totalRevenueMinor,
  };
}

export async function listMemberships(filters = {}) {
  const query = buildMemberQuery(filters);
  let members = await Member.find(query).sort({ createdAt: -1 }).limit(500).lean();

  if (filters.membershipStatus) {
    members = members.filter((m) => computeDisplayStatus(m) === filters.membershipStatus);
  }

  if (filters.eventAttendance === "attended") {
    const engagement = await aggregateEngagementForEmails(members.map((m) => m.email));
    members = members.filter((m) => (engagement.get(normalizeEmail(m.email))?.eventsAttended || 0) > 0);
  } else if (filters.eventAttendance === "upcoming") {
    const engagement = await aggregateEngagementForEmails(members.map((m) => m.email));
    members = members.filter((m) => (engagement.get(normalizeEmail(m.email))?.upcomingEvents || 0) > 0);
  }

  if (filters.ticketPurchaser === "true") {
    const engagement = await aggregateEngagementForEmails(members.map((m) => m.email));
    members = members.filter((m) => (engagement.get(normalizeEmail(m.email))?.ticketSpendMinor || 0) > 0);
  }

  const engagement = await aggregateEngagementForEmails(members.map((m) => m.email));
  const platformRows = members.map((m) =>
    formatMemberSummary(m, engagement.get(normalizeEmail(m.email)) || {}, { source: "platform" })
  );

  const platformEmails = new Set(members.map((m) => normalizeEmail(m.email)));
  let ttRows = await loadTicketTailorMembershipRows({ platformEmails, filters });

  if (filters.eventAttendance === "attended") {
    const ttEngagement = await aggregateEngagementForEmails(ttRows.map((r) => r.email));
    ttRows = ttRows.filter((r) => (ttEngagement.get(normalizeEmail(r.email))?.eventsAttended || 0) > 0);
  } else if (filters.eventAttendance === "upcoming") {
    const ttEngagement = await aggregateEngagementForEmails(ttRows.map((r) => r.email));
    ttRows = ttRows.filter((r) => (ttEngagement.get(normalizeEmail(r.email))?.upcomingEvents || 0) > 0);
  }

  if (filters.ticketPurchaser === "true") {
    const ttEngagement = await aggregateEngagementForEmails(ttRows.map((r) => r.email));
    ttRows = ttRows.filter((r) => (ttEngagement.get(normalizeEmail(r.email))?.ticketSpendMinor || 0) > 0);
  }

  if (ttRows.length) {
    const ttEngagement = await aggregateEngagementForEmails(ttRows.map((r) => r.email));
    ttRows = ttRows.map((row) => ({
      ...row,
      ...(ttEngagement.get(normalizeEmail(row.email)) || {}),
      eventsAttended: ttEngagement.get(normalizeEmail(row.email))?.eventsAttended || 0,
      upcomingEvents: ttEngagement.get(normalizeEmail(row.email))?.upcomingEvents || 0,
      lastEventAttended: ttEngagement.get(normalizeEmail(row.email))?.lastEventAttended || null,
      lastEventAttendedLabel: ttEngagement.get(normalizeEmail(row.email))?.lastEventAttended
        ? formatDateGb(ttEngagement.get(normalizeEmail(row.email)).lastEventAttended)
        : "—",
    }));
  }

  return [...platformRows, ...ttRows].sort(
    (a, b) => new Date(b.memberSince || b.createdAt || 0) - new Date(a.memberSince || a.createdAt || 0)
  );
}

async function buildEventParticipation(email) {
  const norm = normalizeEmail(email);
  const tickets = await Ticket.find({ attendeeEmail: norm })
    .sort({ createdAt: -1 })
    .lean();
  const orderIds = [...new Set(tickets.map((t) => String(t.orderId)))];
  const eventIds = [...new Set(tickets.map((t) => String(t.eventId)))];

  const [orders, events] = await Promise.all([
    TicketOrder.find({ _id: { $in: orderIds } }).lean(),
    Event.find({ _id: { $in: eventIds } }).lean(),
  ]);
  const orderMap = new Map(orders.map((o) => [String(o._id), o]));
  const eventMap = new Map(events.map((e) => [String(e._id), e]));

  const grouped = new Map();
  for (const t of tickets) {
    const key = `${t.eventId}-${t.ticketTypeId}`;
    if (!grouped.has(key)) {
      const ev = eventMap.get(String(t.eventId));
      const ord = orderMap.get(String(t.orderId));
      grouped.set(key, {
        eventName: ev?.title || "Event",
        eventDate: ev?.date || null,
        eventDateLabel: formatDateGb(ev?.date),
        ticketType: t.ticketTypeName,
        quantity: 0,
        bookingStatus: ord?.paymentStatus || "paid",
        checkInStatus: t.checkedIn ? "checked_in" : "not_checked_in",
        amountPaidMinor: ord?.totalAmountMinor || 0,
        bookingDate: ord?.createdAt || t.createdAt,
        source: "platform",
      });
    }
    const row = grouped.get(key);
    row.quantity += 1;
    if (t.checkedIn) row.checkInStatus = "checked_in";
  }

  return [...grouped.values()];
}

async function buildActivityTimeline(member, extra = {}) {
  const events = [];
  const push = (type, date, summary, detail = {}) => {
    if (!date) return;
    events.push({ type, date, summary, detail });
  };

  push("membership_purchased", member.createdAt, "Membership purchased", {
    membershipId: member.membershipId,
  });
  if (member.updatedAt && member.updatedAt > member.createdAt) {
    push("membership_updated", member.updatedAt, "Membership record updated");
  }
  if (member.membershipStatus === "expired") {
    push("membership_expired", member.expiryDate, "Membership expired");
  }
  if (member.membershipStatus === "cancelled") {
    push("membership_cancelled", member.updatedAt, "Membership cancelled");
  }

  const payments = await PaymentTransaction.find({
    kind: "membership",
    donorEmail: normalizeEmail(member.email),
  })
    .sort({ paidAt: -1 })
    .lean();
  for (const p of payments) {
    push("membership_payment", p.paidAt, `Membership payment — ${formatMoney(p.amountMinor)}`, {
      receiptNumber: p.receiptNumber,
    });
  }

  const tickets = await Ticket.find({ attendeeEmail: normalizeEmail(member.email) })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  for (const t of tickets) {
    push("ticket_purchased", t.createdAt, `Event ticket purchased — ${t.ticketNumber}`, {
      ticketNumber: t.ticketNumber,
    });
    if (t.checkedIn) {
      push("event_attended", t.checkedInAt || t.updatedAt, `Checked in — ${t.ticketNumber}`);
    }
    if (t.status === "refunded") {
      push("ticket_refunded", t.updatedAt, `Ticket refunded — ${t.ticketNumber}`);
    }
  }

  const tt = await TicketTailorBooking.find({ email: normalizeEmail(member.email) })
    .sort({ bookingDate: -1 })
    .limit(50)
    .lean();
  for (const b of tt) {
    push(
      "tickettailor_booking",
      b.bookingDate,
      `TicketTailor booking — ${b.eventName}`,
      { orderId: b.ticketTailorOrderId }
    );
    if (b.checkedIn) {
      push("event_attended", b.checkedInAt || b.bookingDate, `TicketTailor check-in — ${b.eventName}`);
    }
  }

  const audits = await getAuditLogsForTarget(member._id?.toString() || member.id, 30);
  for (const a of audits) {
    push(a.action, a.createdAt, a.summary || a.action);
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

export async function getMembershipDetail(id) {
  if (String(id).startsWith("tt:")) {
    return getTicketTailorMembershipDetail(String(id).slice(3));
  }

  const member = await Member.findById(id).lean();
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }

  const email = normalizeEmail(member.email);
  const [user, dashboardMembership, engagement, eventParticipation, ttBookings, payments, tickets] =
    await Promise.all([
      member.userId ? User.findById(member.userId).select("firstName lastName email phone").lean() : null,
      member.userId
        ? Membership.findOne({ userId: member.userId, active: true }).lean()
        : null,
      aggregateEngagementForEmails([email]).then((m) => m.get(email) || {}),
      buildEventParticipation(email),
      TicketTailorBooking.find({ email }).sort({ bookingDate: -1 }).lean(),
      PaymentTransaction.find({ kind: "membership", donorEmail: email }).sort({ paidAt: -1 }).lean(),
      Ticket.find({ attendeeEmail: email }).lean(),
    ]);

  const voucherOrders = await TicketOrder.find({
    attendeeEmail: email,
    voucherCode: { $ne: "" },
    paymentStatus: "paid",
  }).lean();

  const membershipSavingsMinor = tickets.reduce((sum, t) => {
    const ord = voucherOrders.find((o) => String(o._id) === String(t.orderId));
    return sum + (ord?.discountAmountMinor || 0);
  }, 0);

  const timeline = await buildActivityTimeline(member);

  return {
    member: formatMemberSummary(member, engagement),
    user,
    dashboardMembership,
    summary: {
      totalEventsAttended: engagement.eventsAttended || 0,
      upcomingEvents: engagement.upcomingEvents || 0,
      totalTicketsPurchased: tickets.length + ttBookings.length,
      lifetimeTicketSpend: formatMoney(engagement.ticketSpendMinor || 0),
      lifetimeTicketSpendMinor: engagement.ticketSpendMinor || 0,
      discountsUsed: voucherOrders.length,
      membershipSavings: formatMoney(membershipSavingsMinor),
      membershipSavingsMinor,
    },
    eventParticipation,
    ticketTailorActivity: ttBookings.map((b) => ({
      id: b._id.toString(),
      eventName: b.eventName,
      eventDate: b.eventDate,
      eventDateLabel: formatDateGb(b.eventDate),
      ticketType: b.ticketType,
      quantity: b.quantity,
      orderNumber: b.ticketTailorOrderId,
      ticketTailorOrderId: b.ticketTailorOrderId,
      bookingStatus: b.bookingStatus,
      checkInStatus: b.checkedIn ? "checked_in" : "not_checked_in",
      amountPaid: formatMoney(b.amountPaidMinor),
      bookingDate: b.bookingDate,
      bookingDateLabel: formatDateGb(b.bookingDate),
      isMember: Boolean(b.memberId),
    })),
    payments: payments.map((p) => ({
      id: p._id.toString(),
      amount: formatMoney(p.amountMinor),
      receiptNumber: p.receiptNumber,
      tierName: p.tierName,
      paidAt: p.paidAt,
      paidAtLabel: formatDateGb(p.paidAt),
      paymentReference: p.paymentIntentId,
    })),
    discounts: {
      voucherCodesUsed: voucherOrders.map((o) => ({
        code: o.voucherCode,
        orderNumber: o.orderNumber,
        discount: formatMoney(o.discountAmountMinor),
        date: formatDateGb(o.createdAt),
      })),
      membershipDiscountsUsed: voucherOrders.length,
      totalSavings: formatMoney(membershipSavingsMinor),
    },
    notes: member.notes || "",
    timeline,
  };
}

export async function createMembership(data, adminId) {
  const email = normalizeEmail(data.email);
  if (!email) {
    const err = new Error("Email is required.");
    err.status = 400;
    throw err;
  }

  const plan =
    data.membershipType === "custom"
      ? { id: "custom", name: data.customTypeName || "Custom", durationDays: 365, benefits: [] }
      : getPlan(data.membershipType);
  if (!plan && data.membershipType !== "custom") {
    const err = new Error("Invalid membership type.");
    err.status = 400;
    throw err;
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = data.endDate
    ? new Date(data.endDate)
    : new Date(startDate.getTime() + (plan?.durationDays || 365) * 86400000);

  const verificationToken = data.generateQr !== false ? crypto.randomUUID() : crypto.randomUUID();
  const membershipId = await buildMembershipId(plan?.id || "custom", startDate);
  const receiptNumber = await buildMembershipReceiptNumber(startDate);
  const paymentReference = `manual-${crypto.randomUUID()}`;

  let userId = null;
  if (data.existingUserId && mongoose.isValidObjectId(data.existingUserId)) {
    userId = new mongoose.Types.ObjectId(data.existingUserId);
  } else {
    const user = await User.findOne({ email }).select("_id").lean();
    if (user) userId = user._id;
  }

  const member = await Member.create({
    membershipId,
    firstName: data.firstName?.trim() || "Member",
    lastName: data.lastName?.trim() || "",
    email,
    phone: data.phone || "",
    country: data.country || "",
    membershipType: plan?.name || data.customTypeName || "Custom",
    planId: plan?.id || "custom",
    amountPaidMinor: Number(data.amountPaidMinor) || plan?.feeMinor || 0,
    currency: "eur",
    startDate,
    expiryDate: endDate,
    membershipStatus:
      data.paymentStatus === "pending" ? "pending_payment" : "active",
    paymentStatus: data.paymentStatus || "complimentary",
    autoRenewal: Boolean(data.autoRenewal),
    notes: data.notes || "",
    qrCodeUrl: buildMembershipQrImageUrl(verificationToken),
    verificationToken,
    paymentReference,
    receiptNumber,
    userId,
  });

  if (userId) {
    await Membership.findOneAndUpdate(
      { userId, active: true },
      {
        userId,
        active: true,
        planId: member.planId,
        planName: member.membershipType,
        feeMinor: member.amountPaidMinor,
        startedAt: startDate,
        endsAt: endDate,
        membershipNumber: membershipId,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  if (data.sendEmail) {
    const payload = buildMembershipEmailPayload({
      member,
      plan: plan || { benefits: [] },
      intent: { metadata: {} },
      paymentMethod: data.paymentStatus === "paid" ? "Admin issued" : "Complimentary",
    });
    await sendMembershipEmails({ emailPayload: payload, memberEmail: email });
  }

  await logAdminAction({
    adminId,
    action: "membership_created",
    targetId: member._id.toString(),
    summary: `Membership ${membershipId} issued to ${email}`,
  });

  return formatMemberSummary(member.toObject());
}

export async function updateMembership(id, data, adminId) {
  const member = await Member.findById(id);
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }

  const fields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "country",
    "notes",
    "autoRenewal",
    "paymentStatus",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) member[f] = data[f];
  }
  if (data.email) member.email = normalizeEmail(data.email);
  if (data.startDate) member.startDate = new Date(data.startDate);
  if (data.endDate) member.expiryDate = new Date(data.endDate);
  if (data.membershipType) {
    const plan = getPlan(data.membershipType);
    if (plan) {
      member.planId = plan.id;
      member.membershipType = plan.name;
    }
  }
  if (data.membershipStatus) member.membershipStatus = data.membershipStatus;

  await member.save();

  if (member.userId) {
    await Membership.findOneAndUpdate(
      { userId: member.userId, active: true },
      {
        planId: member.planId,
        planName: member.membershipType,
        endsAt: member.expiryDate,
        membershipNumber: member.membershipId,
      }
    );
  }

  await logAdminAction({
    adminId,
    action: "membership_updated",
    targetId: member._id.toString(),
    summary: `Membership ${member.membershipId} updated`,
  });

  return formatMemberSummary(member.toObject());
}

export async function deleteMembership(id, adminId) {
  const member = await Member.findByIdAndDelete(id);
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }
  if (member.userId) {
    await Membership.updateMany({ userId: member.userId }, { active: false });
  }
  await logAdminAction({
    adminId,
    action: "membership_deleted",
    targetId: id,
    summary: `Membership ${member.membershipId} deleted`,
  });
  return { deleted: true };
}

export async function renewMembership(id, data, adminId) {
  const member = await Member.findById(id);
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }

  const plan = getPlan(member.planId) || { durationDays: 365 };
  const base = member.expiryDate > new Date() ? member.expiryDate : new Date();
  const extraDays = Number(data?.extraDays) || plan.durationDays || 365;
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + extraDays);

  member.expiryDate = data.endDate ? new Date(data.endDate) : newExpiry;
  member.membershipStatus = "active";
  member.paymentStatus = data.paymentStatus || member.paymentStatus || "paid";
  await member.save();

  if (member.userId) {
    await Membership.findOneAndUpdate(
      { userId: member.userId, active: true },
      { endsAt: member.expiryDate, active: true }
    );
  }

  await logAdminAction({
    adminId,
    action: "membership_renewed",
    targetId: member._id.toString(),
    summary: `Membership ${member.membershipId} renewed until ${formatDateGb(member.expiryDate)}`,
  });

  return formatMemberSummary(member.toObject());
}

export async function cancelMembership(id, adminId) {
  const member = await Member.findById(id);
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }
  member.membershipStatus = "cancelled";
  await member.save();
  if (member.userId) {
    await Membership.updateMany({ userId: member.userId }, { active: false });
  }
  await logAdminAction({
    adminId,
    action: "membership_cancelled",
    targetId: member._id.toString(),
    summary: `Membership ${member.membershipId} cancelled`,
  });
  return formatMemberSummary(member.toObject());
}

export async function resendMembershipEmail(id, adminId) {
  const member = await Member.findById(id).lean();
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }
  const plan = getPlan(member.planId) || { benefits: [] };
  const payload = buildMembershipEmailPayload({
    member,
    plan,
    intent: { metadata: {} },
    paymentMethod: "Membership confirmation",
  });
  await sendMembershipEmails({ emailPayload: payload, memberEmail: member.email });
  await logAdminAction({
    adminId,
    action: "email_resent",
    targetId: id,
    summary: `Membership email resent to ${member.email}`,
  });
  return { sent: true };
}

export async function regenerateMembershipQr(id, adminId) {
  const member = await Member.findById(id);
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }
  member.verificationToken = crypto.randomUUID();
  member.qrCodeUrl = buildMembershipQrImageUrl(member.verificationToken);
  await member.save();
  await logAdminAction({
    adminId,
    action: "qr_regenerated",
    targetId: id,
    summary: `QR regenerated for ${member.membershipId}`,
  });
  return formatMemberSummary(member.toObject());
}

export async function getMembershipCardPdf(id, adminId) {
  const member = await Member.findById(id).lean();
  if (!member) {
    const err = new Error("Membership not found.");
    err.status = 404;
    throw err;
  }
  const plan = getPlan(member.planId) || { benefits: [] };
  const values = buildMembershipEmailPayload({
    member,
    plan,
    intent: { metadata: {} },
    paymentMethod: "Membership card",
  });
  const buffer = await renderMembershipReceiptPdf(values);
  await logAdminAction({
    adminId,
    action: "card_downloaded",
    targetId: id,
    summary: `Membership card downloaded for ${member.membershipId}`,
  });
  return { buffer, filename: `membership-card-${member.membershipId}.pdf` };
}

export function membershipsToCsv(rows) {
  const header = [
    "Membership ID",
    "Name",
    "Email",
    "Type",
    "Status",
    "Member Since",
    "Member Until",
    "Payment Status",
    "Events Attended",
    "Upcoming Events",
  ];
  const lines = rows.map((r) =>
    [
      r.membershipId,
      r.fullName,
      r.email,
      r.membershipType,
      r.membershipStatus,
      r.memberSinceLabel,
      r.memberUntilLabel,
      r.paymentStatus,
      r.eventsAttended,
      r.upcomingEvents,
    ]
      .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
