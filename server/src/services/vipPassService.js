import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import TicketType from "../models/TicketType.js";
import { getNextSequence } from "../utils/sequence.js";
import { generateVerificationToken } from "./eventService.js";
import { buildTicketQrPath } from "./ticketQrService.js";
import { buildTicketPdfUrl } from "../utils/ticketPdfAccess.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { sendVipPassEmail, sendVipPassGroupEmail } from "./vipPassMailer.js";
import { voidAdminTicket } from "./ticketAdminService.js";

// Deliberately NOT named "VIP Pass" — ComplimentaryBookingService.checkoutFestivalPass()
// regex-matches TicketType.name against /festival|day pass|weekend pass|vip pass/i to
// force paid-checkout "festival pass" handling. This ticket type is never salesEnabled/
// showPublicly, so a real customer can't reach that path, but the internal name still
// avoids the collision entirely. All guest/admin-facing text says "VIP Pass".
const VIP_TICKET_TYPE_NAME = "VIP Guest Pass";
const MAX_BULK_GUESTS = 300;
const MAX_GROUP_GUESTS = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitGuestName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  // TicketOrder.attendeeLastName is a required field — a single-word name
  // (e.g. "Cher") must not produce an empty string here.
  return { firstName: parts[0] || "Guest", lastName: parts.slice(1).join(" ") || "-" };
}

async function buildOrderNumber() {
  const seq = await getNextSequence("ticket_order");
  return `VOICE-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

async function buildTicketNumber() {
  const seq = await getNextSequence("ticket");
  return `TKT-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

async function ensureVipPassTicketType(eventId) {
  return TicketType.findOneAndUpdate(
    { eventId, name: VIP_TICKET_TYPE_NAME },
    {
      $setOnInsert: {
        eventId,
        name: VIP_TICKET_TYPE_NAME,
        priceMinor: 0,
        capacity: 100000,
        salesEnabled: false,
        showPublicly: false,
        status: "active",
        description: "Admin-issued VIP guest pass — not available for public purchase.",
      },
    },
    { upsert: true, new: true }
  );
}

/** Admin-issued VIP guest pass — no payment, no checkout, own themed PDF/email. */
export async function issueVipPass({ eventId, guestName, guestEmail }, adminId = null) {
  const name = String(guestName || "").trim().slice(0, 160);
  const email = String(guestEmail || "").trim().toLowerCase();
  if (!eventId) {
    const err = new Error("eventId is required.");
    err.status = 400;
    throw err;
  }
  if (!name) {
    const err = new Error("Guest name is required.");
    err.status = 400;
    throw err;
  }
  if (!email || !EMAIL_RE.test(email)) {
    const err = new Error("A valid guest email is required.");
    err.status = 400;
    throw err;
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const ticketType = await ensureVipPassTicketType(event._id);
  const { firstName, lastName } = splitGuestName(name);

  const order = await TicketOrder.create({
    orderNumber: await buildOrderNumber(),
    orderType: "TICKET_ONLY",
    userId: null,
    eventId: event._id,
    attendeeFirstName: firstName,
    attendeeLastName: lastName,
    attendeeEmail: email,
    lineItems: [
      {
        ticketTypeId: ticketType._id,
        ticketTypeName: ticketType.name,
        quantity: 1,
        unitPriceMinor: 0,
        originalPriceMinor: 0,
        finalPriceMinor: 0,
      },
    ],
    subtotalMinor: 0,
    totalAmountMinor: 0,
    paymentStatus: "complimentary",
    paymentMethod: "complimentary",
    orderStatus: "COMPLETED",
    adminIssued: true,
    adminIssuedBy: adminId || null,
    bookingMode: "vip_guest",
  });

  const verificationToken = generateVerificationToken();
  const ticketNumber = await buildTicketNumber();

  const ticket = await Ticket.create({
    ticketNumber,
    orderId: order._id,
    eventId: event._id,
    ticketTypeId: ticketType._id,
    ticketTypeName: ticketType.name,
    attendeeName: name,
    attendeeEmail: email,
    verificationToken,
    qrCodeUrl: buildTicketQrPath(verificationToken),
    pdfUrl: buildTicketPdfUrl(ticketNumber, verificationToken),
    status: "valid",
  });

  await TicketType.updateOne({ _id: ticketType._id }, { $inc: { soldCount: 1 } });

  const emailResult = await sendVipPassEmail({ order, ticket, event }).catch((error) => {
    console.warn("[vip-pass] Could not send VIP pass email:", error.message);
    return { sent: false, error: error.message };
  });

  return { order: formatOrder(order), ticket: formatTicket(ticket), event, emailResult };
}

/** Issues a whole party's VIP passes under ONE order, sent as ONE collated PDF to the
 *  primary contact's email — each named guest still gets their own real Ticket with its
 *  own verification token, so each is independently scannable at the door. */
export async function issueVipPassGroup({ eventId, primaryContactName, primaryContactEmail, guestNames }, adminId = null) {
  const contactName = String(primaryContactName || "").trim().slice(0, 160);
  const contactEmail = String(primaryContactEmail || "").trim().toLowerCase();
  const names = (Array.isArray(guestNames) ? guestNames : [])
    .map((n) => String(n || "").trim().slice(0, 160))
    .filter(Boolean);

  if (!eventId) {
    const err = new Error("eventId is required.");
    err.status = 400;
    throw err;
  }
  if (!contactName) {
    const err = new Error("Primary contact name is required.");
    err.status = 400;
    throw err;
  }
  if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
    const err = new Error("A valid primary contact email is required.");
    err.status = 400;
    throw err;
  }
  if (!names.length) {
    const err = new Error("At least one guest name is required.");
    err.status = 400;
    throw err;
  }
  if (names.length > MAX_GROUP_GUESTS) {
    const err = new Error(`No more than ${MAX_GROUP_GUESTS} guests per group.`);
    err.status = 400;
    throw err;
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const ticketType = await ensureVipPassTicketType(event._id);
  const { firstName, lastName } = splitGuestName(contactName);

  const order = await TicketOrder.create({
    orderNumber: await buildOrderNumber(),
    orderType: "TICKET_ONLY",
    userId: null,
    eventId: event._id,
    attendeeFirstName: firstName,
    attendeeLastName: lastName,
    attendeeEmail: contactEmail,
    lineItems: [
      {
        ticketTypeId: ticketType._id,
        ticketTypeName: ticketType.name,
        quantity: names.length,
        unitPriceMinor: 0,
        originalPriceMinor: 0,
        finalPriceMinor: 0,
      },
    ],
    subtotalMinor: 0,
    totalAmountMinor: 0,
    paymentStatus: "complimentary",
    paymentMethod: "complimentary",
    orderStatus: "COMPLETED",
    adminIssued: true,
    adminIssuedBy: adminId || null,
    bookingMode: "vip_guest",
  });

  const tickets = [];
  for (const guestName of names) {
    const verificationToken = generateVerificationToken();
    const ticketNumber = await buildTicketNumber();
    const ticket = await Ticket.create({
      ticketNumber,
      orderId: order._id,
      eventId: event._id,
      ticketTypeId: ticketType._id,
      ticketTypeName: ticketType.name,
      attendeeName: guestName,
      attendeeEmail: contactEmail,
      verificationToken,
      qrCodeUrl: buildTicketQrPath(verificationToken),
      pdfUrl: buildTicketPdfUrl(ticketNumber, verificationToken),
      status: "valid",
    });
    tickets.push(ticket);
  }

  await TicketType.updateOne({ _id: ticketType._id }, { $inc: { soldCount: names.length } });

  const emailResult = await sendVipPassGroupEmail({ order, tickets, event }).catch((error) => {
    console.warn("[vip-pass] Could not send VIP pass group email:", error.message);
    return { sent: false, error: error.message };
  });

  return {
    order: formatOrder(order),
    tickets: tickets.map((t) => formatTicket(t)),
    event,
    emailResult,
  };
}

/** guests: [{ name, email }] — issued sequentially (not Promise.all) so order-number
 *  sequence allocation can't race and SMTP sends don't all fire at once. */
export async function bulkIssueVipPasses({ eventId, guests }, adminId = null) {
  const list = (Array.isArray(guests) ? guests : []).slice(0, MAX_BULK_GUESTS);
  if (!list.length) {
    const err = new Error("At least one guest is required.");
    err.status = 400;
    throw err;
  }

  const results = [];
  for (const guest of list) {
    try {
      const result = await issueVipPass(
        { eventId, guestName: guest?.name, guestEmail: guest?.email },
        adminId
      );
      results.push({ input: guest, success: true, ticket: result.ticket });
    } catch (error) {
      results.push({ input: guest, success: false, error: error.message || "Could not issue pass." });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  return { total: list.length, succeeded, failed: list.length - succeeded, results };
}

export async function listVipGuestsForEvent(eventId) {
  if (!eventId) {
    const err = new Error("eventId is required.");
    err.status = 400;
    throw err;
  }
  const orders = await TicketOrder.find({ eventId, bookingMode: "vip_guest" }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  if (!orderIds.length) return [];

  const tickets = await Ticket.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 }).lean();
  return tickets.map((t) => ({
    ticketId: t._id.toString(),
    name: t.attendeeName,
    email: t.attendeeEmail,
    ticketNumber: t.ticketNumber,
    status: t.status,
    checkedIn: t.checkedIn,
    checkedInAt: t.checkedInAt,
    issuedAt: t.createdAt,
  }));
}

/** Guarded to only ever resend/void a real VIP pass, never an ordinary ticket. */
async function loadVipTicketOrThrow(ticketId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("VIP pass not found.");
    err.status = 404;
    throw err;
  }
  const order = await TicketOrder.findById(ticket.orderId).lean();
  if (!order || order.bookingMode !== "vip_guest") {
    const err = new Error("This ticket is not a VIP pass.");
    err.status = 400;
    throw err;
  }
  return { ticket, order };
}

export async function resendVipPass(ticketId) {
  const { ticket, order } = await loadVipTicketOrThrow(ticketId);
  const event = await Event.findById(ticket.eventId).lean();

  // A group pass was originally issued as ONE collated PDF/email to the primary
  // contact — resend must reproduce that, not a lone guest's pass.
  const orderTickets = await Ticket.find({ orderId: order._id }).sort({ createdAt: 1 });
  const emailResult =
    orderTickets.length > 1
      ? await sendVipPassGroupEmail({ order, tickets: orderTickets, event })
      : await sendVipPassEmail({ order, ticket, event });
  return { sent: true, emailResult, guestCount: orderTickets.length };
}

export async function voidVipPass(ticketId, adminId = null, reason = "") {
  await loadVipTicketOrThrow(ticketId);
  return voidAdminTicket(ticketId, { reason: String(reason || "VIP pass revoked by admin.").trim() }, adminId);
}

export async function getVipPassTheme(eventId) {
  const event = await Event.findById(eventId).select("vipPassTheme").lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  return event.vipPassTheme || { primaryColor: "", backgroundColor: "", logoUrl: "", welcomeMessage: "" };
}

export async function updateVipPassTheme(eventId, payload = {}) {
  const vipPassTheme = {
    primaryColor: String(payload.primaryColor || "").trim().slice(0, 20),
    backgroundColor: String(payload.backgroundColor || "").trim().slice(0, 20),
    logoUrl: String(payload.logoUrl || ""),
    welcomeMessage: String(payload.welcomeMessage || "").trim().slice(0, 500),
  };
  const event = await Event.findByIdAndUpdate(eventId, { vipPassTheme }, { new: true }).select("vipPassTheme").lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  return event.vipPassTheme;
}
