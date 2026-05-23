import mongoose from "mongoose";
import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Membership from "../models/Membership.js";
import EventRegistration from "../models/EventRegistration.js";
import {
  getTicketTailorStatus,
  isTicketTailorConfigured,
  loadTicketTailorAccountData,
  splitOrdersByCategory
} from "./ticketTailorService.js";
import {
  buildMembershipOverviewFromResolved,
  getEarliestMembershipSince,
  resolveMembershipState
} from "./membershipService.js";

function formatEur(minor) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      Number(minor) / 100
    );
  } catch {
    return `€${(Number(minor) / 100).toFixed(2)}`;
  }
}

function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(d);
}

function buildUserMatch(userId, email) {
  const emailNorm = String(email || "").trim().toLowerCase();
  const conditions = [{ donorEmail: emailNorm }];
  if (userId && mongoose.isValidObjectId(userId)) {
    conditions.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
  return { $or: conditions };
}

export async function getDashboardPayloadForUser(safeUser) {
  const userId = safeUser.id;
  const email = safeUser.email;

  const userDoc = await User.findById(userId).lean();
  if (!userDoc) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const oid = userDoc._id;

  const ticketTailorStatusPromise = getTicketTailorStatus();

  const ticketTailorPromise = isTicketTailorConfigured()
    ? loadTicketTailorAccountData(email).catch((err) => {
        console.warn("[dashboard] Ticket Tailor fetch failed:", err.message);
        return { orders: [], issuedMemberships: [] };
      })
    : Promise.resolve({ orders: [], issuedMemberships: [] });

  const [transactions, activityLogs, membership, localEventCount, ticketTailorAccount, ticketTailor] =
    await Promise.all([
      PaymentTransaction.find(buildUserMatch(userId, email)).sort({ paidAt: -1 }).limit(100).lean(),
      ActivityLog.find({ userId: oid }).sort({ createdAt: -1 }).limit(50).lean(),
      Membership.findOne({ userId: oid }).sort({ startedAt: -1 }).lean(),
      EventRegistration.countDocuments({ userId: oid }),
      ticketTailorPromise,
      ticketTailorStatusPromise
    ]);

  const ticketTailorOrders = ticketTailorAccount.orders || [];
  const ttIssuedMemberships = ticketTailorAccount.issuedMemberships || [];

  const {
    membership: ttMembershipOrders,
    donations: ttDonationOrders,
    sponsorships: ttSponsorshipOrders,
    events: ttEventOrders
  } = splitOrdersByCategory(ticketTailorOrders);

  const ticketEventCount = ttEventOrders.length;
  const eventCount =
    localEventCount + (isTicketTailorConfigured() ? ticketEventCount : 0);

  let donationTotalMinor = 0;
  let donationCount = 0;
  let sponsorshipCount = 0;
  let sponsorshipTotalMinor = 0;
  for (const t of transactions) {
    if (t.kind === "donation") {
      donationTotalMinor += t.amountMinor || 0;
      donationCount += 1;
    } else if (t.kind === "sponsorship") {
      sponsorshipCount += 1;
      sponsorshipTotalMinor += t.amountMinor || 0;
    }
  }

  for (const o of ttDonationOrders) {
    donationTotalMinor += o.amountMinor || 0;
    donationCount += 1;
  }

  for (const o of ttSponsorshipOrders) {
    sponsorshipCount += 1;
    sponsorshipTotalMinor += o.amountMinor || 0;
  }

  const donationLabel = formatEur(donationTotalMinor);
  const sponsorshipLabel = formatEur(sponsorshipTotalMinor);

  const membershipResolved = resolveMembershipState({
    user: userDoc,
    mongoMembership: membership,
    ttMembershipOrders,
    ttIssuedMemberships,
    ticketTailorExclusive: Boolean(ticketTailor.configured && ticketTailor.buyerEmailVisible)
  });

  const membershipOverview = buildMembershipOverviewFromResolved(membershipResolved);

  const donationsOverview = {
    totalMinor: donationTotalMinor,
    totalLabel: donationLabel,
    count: donationCount,
    value: donationLabel,
    heading: "Total Donations",
    description: donationCount
      ? `${donationCount} donation${donationCount === 1 ? "" : "s"} — ${donationLabel} total`
      : "No donations yet. Every contribution supports our mission."
  };

  const eventsOverview = {
    count: eventCount,
    value: String(eventCount),
    heading: "Events Registered",
    description: eventCount
      ? `${eventCount} event registration${eventCount === 1 ? "" : "s"}`
      : "You have not registered for an event yet."
  };

  const sponsorshipsOverview = {
    count: sponsorshipCount,
    totalMinor: sponsorshipTotalMinor,
    totalLabel: sponsorshipLabel,
    value: sponsorshipCount > 0 ? sponsorshipLabel : formatEur(0),
    heading: "Sponsorships",
    description: sponsorshipCount
      ? `${sponsorshipCount} sponsorship${sponsorshipCount === 1 ? "" : "s"} — ${sponsorshipLabel} total`
      : "No sponsorship payments yet."
  };

  const activityItems = [];

  for (const t of transactions) {
    if (t.kind === "donation") {
      activityItems.push({
        id: `pay-${t.paymentIntentId}`,
        kind: "donation",
        title: "Donation completed",
        text: `${formatEur(t.amountMinor)} — ${t.tierName || "Donation"}${
          t.receiptNumber ? ` (${t.receiptNumber})` : ""
        }`,
        at: t.paidAt?.toISOString?.() || t.createdAt?.toISOString?.()
      });
    } else {
      activityItems.push({
        id: `pay-${t.paymentIntentId}`,
        kind: "sponsorship",
        title: "Sponsorship confirmed",
        text: `${formatEur(t.amountMinor)} — ${t.tierName || "Sponsorship"}${
          t.receiptNumber ? ` (${t.receiptNumber})` : ""
        }`,
        at: t.paidAt?.toISOString?.() || t.createdAt?.toISOString?.()
      });
    }
  }

  for (const log of activityLogs) {
    const title = log.kind === "profile_updated" ? "Profile updated" : "Account activity";
    activityItems.push({
      id: `log-${log._id}`,
      kind: log.kind,
      title,
      text: log.summary || log.detail || "Update recorded.",
      at: log.createdAt?.toISOString?.()
    });
  }

  for (const o of ttDonationOrders) {
    activityItems.push({
      id: `tt-${o.id}`,
      kind: "donation",
      title: "Donation completed",
      text: `${formatEur(o.amountMinor)} — ${o.eventTitle}`,
      at: o.createdAt
    });
  }

  for (const o of ttSponsorshipOrders) {
    activityItems.push({
      id: `tt-${o.id}`,
      kind: "sponsorship",
      title: "Sponsorship confirmed",
      text: `${formatEur(o.amountMinor)} — ${o.eventTitle}`,
      at: o.createdAt
    });
  }

  for (const o of ttMembershipOrders) {
    activityItems.push({
      id: `tt-${o.id}`,
      kind: "membership",
      title: "Membership purchased",
      text: `${o.eventTitle}${o.amountMinor ? ` — ${formatEur(o.amountMinor)}` : ""}`,
      at: o.createdAt
    });
  }

  for (const o of ttEventOrders) {
    activityItems.push({
      id: `tt-${o.id}`,
      kind: "event_ticket",
      title: "Event ticket purchased",
      text: `${o.eventTitle}${o.amountMinor ? ` — ${formatEur(o.amountMinor)}` : ""}`,
      at: o.createdAt
    });
  }

  activityItems.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const membershipSince = getEarliestMembershipSince(membershipResolved);
  const memberSince = membershipSince ? formatDisplayDate(membershipSince) : "";
  const accountStatus = userDoc.isVerified ? "Verified" : "Pending verification";

  return {
    profile: {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      fullName: [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" "),
      email: userDoc.email,
      phone: userDoc.phone || "",
      memberSince,
      memberSinceIso: membershipSince?.toISOString?.() || null,
      accountStatus
    },
    overview: {
      membership: membershipOverview,
      donations: donationsOverview,
      events: eventsOverview,
      sponsorships: sponsorshipsOverview
    },
    activity: activityItems.slice(0, 80),
    ticketTailor: {
      ...ticketTailor,
      ordersMatched: ticketTailorOrders.length,
      lookupEmail: email
    }
  };
}
