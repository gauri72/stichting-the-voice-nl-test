import mongoose from "mongoose";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import User from "../models/User.js";
import { formatEvent } from "./eventService.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { getAutomaticMemberDiscount, getActiveMembership } from "./discountService.js";
import { resolvePlanId } from "../config/membershipPlans.js";
import { buildTicketPdfUrl } from "../utils/ticketPdfAccess.js";
import { SETTLED_PAYMENT_STATUSES } from "../utils/orderPaymentUtils.js";
import { isTicketTailorConfigured, loadTicketTailorAccountData, splitOrdersByCategory } from "./ticketTailorService.js";
import { awardEventAttendancePoints, ticketTailorEventReferenceId } from "./walletService.js";

const UPCOMING_WINDOW_DAYS = 60;

function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatShortDate(isoOrDate) {
  if (!isoOrDate) return { day: "", month: "" };
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return { day: "", month: "" };
  return {
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d),
  };
}

function parseEventEnd(event) {
  const base = new Date(event.date);
  if (Number.isNaN(base.getTime())) return null;
  const time = String(event.endTime || event.startTime || "23:59").match(/^(\d{1,2}):(\d{2})/);
  if (time) {
    base.setHours(Number(time[1]), Number(time[2]), 59, 999);
  } else {
    base.setHours(23, 59, 59, 999);
  }
  return base;
}

function isEventExpired(event, now = new Date()) {
  const end = parseEventEnd(event);
  return end ? end < now : false;
}

function daysUntil(eventDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function isPremiumPlan(planId) {
  const id = resolvePlanId(planId || "");
  return id === "family" || id === "single" || id === "premiumFamily" || id === "premiumSingle";
}

function isPrivilegedPlan(planId) {
  const id = resolvePlanId(planId || "");
  return id === "privilegedSingle" || id === "privilegedFamily" || id === "privileged";
}

export function resolveBookingStatus(orders, tickets) {
  const paidOrders = (orders || []).filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "free");
  if (!paidOrders.length) return "NOT_BOOKED";

  const eventTickets = tickets || [];
  if (!eventTickets.length) return "NOT_BOOKED";

  const refundedOrders = paidOrders.filter((o) => o.paymentStatus === "refunded");
  if (refundedOrders.length === paidOrders.length) return "REFUNDED";

  const allRefunded =
    eventTickets.length > 0 && eventTickets.every((t) => t.status === "refunded");
  if (allRefunded) return "REFUNDED";

  const allCancelled =
    eventTickets.length > 0 && eventTickets.every((t) => t.status === "cancelled");
  if (allCancelled) return "CANCELLED";

  const anyCheckedIn = eventTickets.some((t) => t.checkedIn && t.status === "valid");
  if (anyCheckedIn) return "CHECKED_IN";

  const anyValid = eventTickets.some((t) => t.status === "valid");
  if (anyValid) return "BOOKED";

  return "NOT_BOOKED";
}

async function resolveMembershipBenefit(userId, event) {
  const membership = await getActiveMembership(userId);
  if (!membership) {
    return { hasMembershipBenefit: false, membershipBenefitLabel: null, membershipBenefitType: null };
  }

  const planId = resolvePlanId(membership.planId);

  if (event.membershipIncluded && isPremiumPlan(planId)) {
    return {
      hasMembershipBenefit: true,
      membershipBenefitLabel: "FREE",
      membershipBenefitType: "included",
      membershipBenefitDescription: "Included in Membership",
    };
  }

  if (event.membershipDiscountEligible !== false) {
    const rule = await getAutomaticMemberDiscount(userId, event._id, "tickets");
    if (rule) {
      if (rule.discountType === "free_ticket" || rule.discountValue >= 100) {
        return {
          hasMembershipBenefit: true,
          membershipBenefitLabel: "FREE",
          membershipBenefitType: "included",
          membershipBenefitDescription: "Included in Membership",
        };
      }
      if (rule.discountType === "percentage" && rule.discountValue > 0) {
        return {
          hasMembershipBenefit: true,
          membershipBenefitLabel: `${rule.discountValue}% Discount`,
          membershipBenefitType: "discount",
          membershipBenefitDescription: "Membership Benefit Available",
        };
      }
    }

    if (isPrivilegedPlan(planId)) {
      return {
        hasMembershipBenefit: true,
        membershipBenefitLabel: "10% Discount",
        membershipBenefitType: "discount",
        membershipBenefitDescription: "Membership Benefit Available",
      };
    }
  }

  return { hasMembershipBenefit: false, membershipBenefitLabel: null, membershipBenefitType: null };
}

function enrichEventCard(event, { orders, tickets, membershipBenefit, now }) {
  const bookingStatus = resolveBookingStatus(orders, tickets);
  const hasPurchasedTicket = bookingStatus !== "NOT_BOOKED";
  const ticketCount = (tickets || []).filter((t) => t.status === "valid" || t.status === "refunded" || t.checkedIn).length;
  const { day, month } = formatShortDate(event.date);
  const daysRemaining = daysUntil(event.date);
  const end = parseEventEnd(event);
  const isUpcoming =
    end && end >= now && daysRemaining != null && daysRemaining <= UPCOMING_WINDOW_DAYS;

  return {
    ...formatEvent(event),
    shortDescription: String(event.description || "").slice(0, 160),
    dateLabel: formatDisplayDate(event.date),
    timeLabel: [event.startTime, event.endTime].filter(Boolean).join(" - "),
    location: event.venueName,
    day,
    month,
    daysRemaining,
    isUpcoming,
    isFeatured: Boolean(event.featured),
    bookingStatus,
    hasPurchasedTicket,
    ticketCount,
    ...membershipBenefit,
    bookingUrl: `/events/${event.slug || event._id}/tickets`,
  };
}

async function loadUserEventData(userId) {
  const oid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(oid).select("email").lean();
  const email = user?.email ? user.email.toLowerCase() : "";
  // A guest checkout (no login) is never linked back to an account afterward, so without
  // also matching by the account's own verified email, an order placed as a guest under
  // that same email would never appear here — same gap fixed in
  // ticketOrderService.js::getUserOrders/getUserTickets, duplicated in this separate
  // dashboard-events data loader.
  const ownedOrders = await TicketOrder.find(
    email ? { $or: [{ userId: oid }, { attendeeEmail: email }] } : { userId: oid }
  ).lean();
  const ownedOrderIds = ownedOrders.map((o) => o._id);
  const tickets = await Ticket.find({
    $or: [
      {
        orderId: { $in: ownedOrderIds },
        assignedUserId: null,
        transferRecipientEmail: { $in: ["", null] },
      },
      { assignedUserId: oid },
      ...(email ? [{ transferRecipientEmail: email }] : []),
    ],
  }).lean();
  const relevantOrderIds = [...new Set(tickets.map((ticket) => ticket.orderId.toString()))];
  const orders = await TicketOrder.find({ _id: { $in: relevantOrderIds } }).lean();

  const ordersByEvent = new Map();
  for (const order of orders) {
    const key = order.eventId?.toString();
    if (!key) continue;
    if (!ordersByEvent.has(key)) ordersByEvent.set(key, []);
    ordersByEvent.get(key).push(order);
  }

  const ticketsByEvent = new Map();
  for (const ticket of tickets) {
    const key = ticket.eventId?.toString();
    if (!key) continue;
    if (!ticketsByEvent.has(key)) ticketsByEvent.set(key, []);
    ticketsByEvent.get(key).push(ticket);
  }

  return { ordersByEvent, ticketsByEvent };
}

export async function getDashboardEventsForUser(userId) {
  const user = await User.findById(userId).select("_id email").lean();
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const events = await Event.find({
    status: "published",
    archived: { $ne: true },
    showOnDashboard: { $ne: false },
  })
    .sort({ featured: -1, date: 1 })
    .lean();

  const activeEvents = events.filter((e) => !isEventExpired(e, now));
  const { ordersByEvent, ticketsByEvent } = await loadUserEventData(userId);

  const cards = await Promise.all(
    activeEvents.map(async (event) => {
      const eventId = event._id.toString();
      const membershipBenefit = await resolveMembershipBenefit(userId, event);
      return enrichEventCard(event, {
        orders: ordersByEvent.get(eventId) || [],
        tickets: ticketsByEvent.get(eventId) || [],
        membershipBenefit,
        now,
      });
    }),
  );

  const featured = cards.filter((e) => e.isFeatured);
  const upcoming = [...cards]
    .filter((e) => e.isUpcoming)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);
  const future = [...cards]
    .filter((e) => !e.isFeatured)
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return new Date(a.date) - new Date(b.date);
    });

  const pastEventIds = new Set();
  for (const event of events) {
    if (!isEventExpired(event, now)) continue;
    const eventId = event._id.toString();
    const tickets = ticketsByEvent.get(eventId) || [];
    const orders = (ordersByEvent.get(eventId) || []).filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "free");
    if (orders.length && tickets.length) pastEventIds.add(eventId);
  }

  const platformHistory = events
    .filter((e) => pastEventIds.has(e._id.toString()))
    .map((event) => {
      const eventId = event._id.toString();
      const tickets = ticketsByEvent.get(eventId) || [];
      const orders = ordersByEvent.get(eventId) || [];
      const bookingStatus = resolveBookingStatus(orders, tickets);
      const primaryTicket = tickets.find((t) => t.ticketNumber) || tickets[0];
      return {
        id: eventId,
        title: event.title,
        slug: event.slug,
        date: event.date,
        dateLabel: formatDisplayDate(event.date),
        bookingStatus,
        ticketCount: tickets.filter((t) => t.status !== "cancelled").length,
        ticketNumber: primaryTicket?.ticketNumber || null,
        pdfUrl: primaryTicket?.ticketNumber
          ? buildTicketPdfUrl(primaryTicket.ticketNumber, primaryTicket.verificationToken)
          : null,
        bookingUrl: `/events/${event.slug || eventId}/tickets`,
        ticketsUrl: `/dashboard/events/${eventId}/tickets`,
        source: "platform",
      };
    });

  // Events bought directly through Ticket Tailor (e.g. before this platform's
  // own checkout existed) have no platform Event/Ticket record to join
  // against, so they're folded in here from the order data itself rather
  // than the events/tickets-by-event maps above. No ticketsUrl/pdfUrl since
  // there's no platform ticket behind them — the client shows a "Ticket
  // Tailor" badge instead of the View Ticket/Download PDF actions.
  let ticketTailorHistory = [];
  if (isTicketTailorConfigured() && user.email) {
    const { orders: ttOrders } = await loadTicketTailorAccountData(user.email).catch(() => ({ orders: [] }));
    const { events: ttEventOrders } = splitOrdersByCategory(ttOrders || []);

    // Ticket Tailor returns one order per ticket, not per checkout — without
    // grouping, a single multi-ticket purchase shows up as many near-identical
    // rows for the same event. Group by event title, count tickets, and use
    // the most recent purchase date as the representative date.
    const grouped = new Map();
    for (const o of ttEventOrders) {
      const key = o.eventTitle || "Event (Ticket Tailor)";
      const entry = grouped.get(key) || { title: key, count: 0, latestDate: null, firstId: o.id };
      entry.count += 1;
      if (!entry.latestDate || new Date(o.createdAt) > new Date(entry.latestDate)) {
        entry.latestDate = o.createdAt;
      }
      grouped.set(key, entry);
    }

    ticketTailorHistory = [...grouped.values()].map((entry) => ({
      id: `tt-${entry.firstId}`,
      title: entry.title,
      slug: null,
      date: entry.latestDate,
      dateLabel: formatDisplayDate(entry.latestDate),
      bookingStatus: "BOOKED",
      ticketCount: entry.count,
      ticketNumber: null,
      pdfUrl: null,
      bookingUrl: null,
      ticketsUrl: null,
      source: "ticketTailor",
    }));

    // Award the same loyalty bonus for Ticket Tailor attendance as for
    // platform bookings. awardEventAttendancePoints() is idempotent per
    // (customerId, referenceId), so running this on every dashboard/My
    // Events load is safe — it only actually awards once per distinct event.
    for (const entry of grouped.values()) {
      await awardEventAttendancePoints(userId, ticketTailorEventReferenceId(entry.title), entry.title).catch((err) => {
        console.warn("[dashboard-events] TT attendance points failed:", err.message);
      });
    }
  }

  const history = [...platformHistory, ...ticketTailorHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const widgetEvents = [...cards]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return {
    featured,
    upcoming,
    future,
    events: cards,
    history,
    widgetEvents,
  };
}

/** "My Bookings" — valid tickets for events that haven't happened yet, with
 * QR codes and PDF links, for the dashboard home page. Empty when the
 * customer has no upcoming bookings (the section hides itself in that case). */
export async function getUpcomingBookingsForUser(userId) {
  const now = new Date();
  const events = await Event.find({
    status: "published",
    archived: { $ne: true },
  }).lean();

  const activeEvents = events.filter((e) => !isEventExpired(e, now));
  const { ordersByEvent, ticketsByEvent } = await loadUserEventData(userId);

  const bookings = activeEvents
    .map((event) => {
      const eventId = event._id.toString();
      const orders = ordersByEvent.get(eventId) || [];
      const hasSettledOrder = orders.some((o) => SETTLED_PAYMENT_STATUSES.includes(o.paymentStatus));
      const tickets = (ticketsByEvent.get(eventId) || []).filter((t) => t.status === "valid");
      if (!hasSettledOrder || !tickets.length) return null;

      return {
        eventId,
        eventTitle: event.title,
        eventSlug: event.slug || "",
        eventDate: event.date,
        dateLabel: formatDisplayDate(event.date),
        timeLabel: [event.startTime, event.endTime].filter(Boolean).join(" - "),
        venueName: event.venueName || "",
        ticketCount: tickets.length,
        ticketsUrl: `/dashboard/events/${eventId}/tickets`,
        tickets: tickets.map(formatTicket),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  return { bookings };
}

export async function getEventBookingStatusForUser(userId, eventId) {
  if (!mongoose.isValidObjectId(eventId)) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const oid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(oid).select("email").lean();
  const email = user?.email ? user.email.toLowerCase() : "";
  const orders = await TicketOrder.find(
    email
      ? { $or: [{ userId: oid }, { attendeeEmail: email }], eventId: event._id }
      : { userId: oid, eventId: event._id }
  ).lean();
  const orderIds = orders.map((o) => o._id);
  const tickets = orderIds.length
    ? await Ticket.find({ orderId: { $in: orderIds } }).lean()
    : [];

  return {
    eventId: event._id.toString(),
    bookingStatus: resolveBookingStatus(orders, tickets),
    hasPurchasedTicket: resolveBookingStatus(orders, tickets) !== "NOT_BOOKED",
    ticketCount: tickets.length,
  };
}

export async function getEventTicketsForUser(userId, eventId) {
  if (!mongoose.isValidObjectId(eventId)) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const oid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(oid).select("email").lean();
  const email = user?.email ? user.email.toLowerCase() : "";
  const ownedOrders = await TicketOrder.find(
    email
      ? {
          $or: [{ userId: oid }, { attendeeEmail: email }],
          eventId: event._id,
          paymentStatus: { $in: SETTLED_PAYMENT_STATUSES },
        }
      : { userId: oid, eventId: event._id, paymentStatus: { $in: SETTLED_PAYMENT_STATUSES } }
  ).select("_id").lean();
  const ownedOrderIds = ownedOrders.map((order) => order._id);
  const tickets = await Ticket.find({
    eventId: event._id,
    $or: [
      {
        orderId: { $in: ownedOrderIds },
        assignedUserId: null,
        transferRecipientEmail: { $in: ["", null] },
      },
      { assignedUserId: oid },
      ...(email ? [{ transferRecipientEmail: email }] : []),
    ],
  }).sort({ createdAt: 1 }).lean();

  if (!tickets.length) {
    const err = new Error("No tickets found for this event.");
    err.status = 404;
    throw err;
  }
  const relevantOrderIds = [...new Set(tickets.map((ticket) => ticket.orderId.toString()))];
  const orders = await TicketOrder.find({ _id: { $in: relevantOrderIds } })
    .sort({ createdAt: -1 })
    .lean();

  const primaryOrder = orders[0];
  const lineSummary = primaryOrder.lineItems?.map((line) => ({
    ticketTypeName: line.ticketTypeName,
    quantity: line.quantity,
  })) || [];

  return {
    event: {
      ...formatEvent(event),
      dateLabel: formatDisplayDate(event.date),
      timeLabel: [event.startTime, event.endTime].filter(Boolean).join(" - "),
    },
    summary: {
      ticketTypes: lineSummary,
      quantity: tickets.length,
      orderNumber: primaryOrder.orderNumber,
      purchaseDate: primaryOrder.createdAt,
      purchaseDateLabel: formatDisplayDate(primaryOrder.createdAt),
      status: resolveBookingStatus(orders, tickets),
      paymentStatus: primaryOrder.paymentStatus,
      totalAmountMinor: primaryOrder.totalAmountMinor,
      paymentMethod: primaryOrder.paymentMethod || "card",
      bookedVia: primaryOrder.bookingMode === "ai_assistant" ? "V.Assist" : "customer",
    },
    orders: orders.map(formatOrder),
    tickets: tickets.map(formatTicket),
    bookingStatus: resolveBookingStatus(orders, tickets),
  };
}
