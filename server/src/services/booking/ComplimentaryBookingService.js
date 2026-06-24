import TicketOrder from "../../models/TicketOrder.js";
import Event from "../../models/Event.js";
import TicketType from "../../models/TicketType.js";
import { fulfillOrder } from "../postPaymentFulfillmentService.js";
import { getNextSequence } from "../../utils/sequence.js";
import { notifyAdminTicketBooking } from "./AdminNotificationService.js";
import { logBookingAudit } from "./ActivityLogService.js";

async function buildOrderNumber() {
  const seq = await getNextSequence("ticket_order");
  return `VOICE-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

/**
 * Admin-issued complimentary tickets — no payment required.
 */
export async function issueComplimentaryBooking(payload, adminId = null) {
  const {
    eventId,
    ticketTypeId,
    quantity = 1,
    attendeeFirstName,
    attendeeLastName,
    attendeeEmail,
    attendeePhone = "",
    note = "",
  } = payload;

  if (!eventId || !ticketTypeId) {
    const err = new Error("eventId and ticketTypeId are required.");
    err.status = 400;
    throw err;
  }
  if (!attendeeFirstName?.trim() || !attendeeLastName?.trim() || !attendeeEmail?.trim()) {
    const err = new Error("Recipient name and email are required.");
    err.status = 400;
    throw err;
  }

  const [event, ticketType] = await Promise.all([
    Event.findById(eventId).lean(),
    TicketType.findById(ticketTypeId).lean(),
  ]);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  if (!ticketType || String(ticketType.eventId) !== String(eventId)) {
    const err = new Error("Ticket type not found for this event.");
    err.status = 404;
    throw err;
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const order = await TicketOrder.create({
    orderNumber: await buildOrderNumber(),
    orderType: "TICKET_ONLY",
    userId: null,
    eventId: event._id,
    attendeeFirstName: attendeeFirstName.trim(),
    attendeeLastName: attendeeLastName.trim(),
    attendeeEmail: attendeeEmail.trim().toLowerCase(),
    attendeePhone: String(attendeePhone || "").trim(),
    lineItems: [
      {
        ticketTypeId: ticketType._id,
        ticketTypeName: ticketType.name,
        quantity: qty,
        unitPriceMinor: 0,
        originalPriceMinor: 0,
        finalPriceMinor: 0,
      },
    ],
    membershipItems: [],
    appliedDiscounts: [],
    subtotalMinor: 0,
    discountAmountMinor: 0,
    membershipDiscountMinor: 0,
    voucherDiscountMinor: 0,
    referralDiscountMinor: 0,
    vatAmountMinor: 0,
    totalAmountMinor: 0,
    paymentStatus: "complimentary",
    orderStatus: "PENDING",
    adminIssued: true,
    adminIssuedBy: adminId || null,
    adminNote: String(note || "").slice(0, 500),
    bookingMode: "complimentary",
  });

  const result = await fulfillOrder(order._id.toString(), null, { isFreeOrder: true });

  await logBookingAudit({
    action: "COMBINED_ORDER_CREATED",
    orderId: order.orderNumber,
    email: order.attendeeEmail,
    eventId: order.eventId,
    metadata: { complimentary: true, adminId, note },
  });

  await notifyAdminTicketBooking({
    order: result.order,
    event,
    tickets: result.tickets,
    paymentStatus: "complimentary",
  });

  return result;
}

/**
 * Festival pass booking — uses standard checkout with festival_pass mode detection.
 */
export async function checkoutFestivalPass(payload, userId = null) {
  const { checkoutBooking } = await import("./BookingFlowResolver.js");
  const items = payload.items || [];
  const ticketTypes = items.length
    ? await TicketType.find({ _id: { $in: items.map((i) => i.ticketTypeId) } }).lean()
    : [];
  const isFestivalPass = ticketTypes.some((t) =>
    /festival|day pass|weekend pass|vip pass/i.test(t.name || "")
  );
  if (!isFestivalPass && !payload.forceFestivalPass) {
    const err = new Error("Selected ticket types are not festival passes.");
    err.status = 400;
    throw err;
  }
  return checkoutBooking("event_ticket", { ...payload, bookingMode: "festival_pass" }, userId);
}
