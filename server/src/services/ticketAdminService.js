import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import TicketType from "../models/TicketType.js";
import Event from "../models/Event.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { isOrderPaymentSettled } from "../utils/orderPaymentUtils.js";
import { verifyTicketPdfAccess } from "../utils/ticketPdfAccess.js";
import { formatMoney } from "./ticketPricingService.js";
import { sendTicketConfirmationEmail } from "./ticketMailer.js";

export async function listAdminTickets(filters = {}) {
  const {
    search,
    eventId,
    ticketTypeId,
    paymentStatus,
    checkedIn,
    section,
    row,
    seatCategory,
    page = 1,
    limit = 50,
  } = filters;

  const orderFilter = {};
  if (paymentStatus) orderFilter.paymentStatus = paymentStatus;
  if (eventId) orderFilter.eventId = eventId;

  let orderIds = null;
  if (Object.keys(orderFilter).length) {
    const orders = await TicketOrder.find(orderFilter).select("_id").lean();
    orderIds = orders.map((o) => o._id);
    if (!orderIds.length) return { tickets: [], total: 0 };
  }

  const ticketFilter = {};
  if (orderIds) ticketFilter.orderId = { $in: orderIds };
  if (eventId) ticketFilter.eventId = eventId;
  if (ticketTypeId) ticketFilter.ticketTypeId = ticketTypeId;
  if (checkedIn === "true") ticketFilter.checkedIn = true;
  if (checkedIn === "false") ticketFilter.checkedIn = false;
  if (section) ticketFilter.section = new RegExp(section.trim(), "i");
  if (row) ticketFilter.row = new RegExp(`^${row.trim()}$`, "i");
  if (seatCategory) ticketFilter.seatCategory = seatCategory;

  if (search?.trim()) {
    const q = search.trim();
    const matchingOrders = await TicketOrder.find({
      $or: [
        { orderNumber: new RegExp(q, "i") },
        { attendeeEmail: new RegExp(q, "i") },
        { attendeeFirstName: new RegExp(q, "i") },
        { attendeeLastName: new RegExp(q, "i") },
      ],
    })
      .select("_id")
      .lean();
    const searchOrderIds = matchingOrders.map((o) => o._id);

    ticketFilter.$or = [
      { ticketNumber: new RegExp(q, "i") },
      { attendeeName: new RegExp(q, "i") },
      { attendeeEmail: new RegExp(q, "i") },
      ...(searchOrderIds.length ? [{ orderId: { $in: searchOrderIds } }] : []),
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [tickets, total] = await Promise.all([
    Ticket.find(ticketFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Ticket.countDocuments(ticketFilter),
  ]);

  const orderIdSet = [...new Set(tickets.map((t) => t.orderId.toString()))];
  const eventIdSet = [...new Set(tickets.map((t) => t.eventId.toString()))];

  const [orders, events] = await Promise.all([
    TicketOrder.find({ _id: { $in: orderIdSet } }).lean(),
    Event.find({ _id: { $in: eventIdSet } }).lean(),
  ]);

  const orderMap = Object.fromEntries(orders.map((o) => [o._id.toString(), o]));
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e]));

  return {
    tickets: tickets.map((t) => ({
      ...formatTicket(t),
      order: orderMap[t.orderId.toString()] ? formatOrder(orderMap[t.orderId.toString()]) : null,
      eventTitle: eventMap[t.eventId.toString()]?.title || "",
    })),
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

export async function getTicketStats() {
  const [soldTickets, paidOrders, checkedIn, refunded, revenueAgg, capacityAgg] = await Promise.all([
    Ticket.countDocuments({ status: "valid" }),
    TicketOrder.countDocuments({ paymentStatus: { $in: ["paid", "free"] } }),
    Ticket.countDocuments({ checkedIn: true, status: "valid" }),
    Ticket.countDocuments({ status: "refunded" }),
    TicketOrder.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    TicketType.aggregate([
      { $group: { _id: null, capacity: { $sum: "$capacity" }, sold: { $sum: "$soldCount" } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const cap = capacityAgg[0] || { capacity: 0, sold: 0 };

  return {
    totalTicketsSold: soldTickets,
    totalRevenue: formatMoney(revenue),
    totalRevenueMinor: revenue,
    attendeesCount: paidOrders,
    ticketsCheckedIn: checkedIn,
    remainingCapacity: Math.max(0, cap.capacity - cap.sold),
    refundedTickets: refunded,
  };
}

export async function updateAdminTicket(ticketId, payload, adminId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }

  if (payload.attendeeName !== undefined) {
    ticket.attendeeName = String(payload.attendeeName).trim().slice(0, 160);
  }
  if (payload.attendeeEmail !== undefined) {
    ticket.attendeeEmail = String(payload.attendeeEmail).trim().toLowerCase();
  }
  if (payload.ticketTypeId) {
    const tt = await TicketType.findById(payload.ticketTypeId);
    if (!tt) {
      const err = new Error("Ticket type not found.");
      err.status = 400;
      throw err;
    }
    ticket.ticketTypeId = tt._id;
    ticket.ticketTypeName = tt.name;
  }
  if (payload.status === "refunded") {
    ticket.status = "refunded";
    ticket.checkedIn = false;
  }

  await ticket.save();
  return formatTicket(ticket);
}

export async function checkInTicket(verificationToken, adminId) {
  const ticket = await Ticket.findOne({ verificationToken });
  if (!ticket) {
    const err = new Error("Invalid ticket. QR code not recognized.");
    err.status = 404;
    throw err;
  }

  if (ticket.status === "refunded" || ticket.status === "cancelled") {
    const err = new Error("This ticket has been cancelled or refunded.");
    err.status = 400;
    throw err;
  }

  if (ticket.checkedIn) {
    const err = new Error("This ticket has already been checked in.");
    err.status = 409;
    err.ticket = formatTicket(ticket);
    throw err;
  }

  const [order, event] = await Promise.all([
    TicketOrder.findById(ticket.orderId).lean(),
    Event.findById(ticket.eventId).lean(),
  ]);

  if (!order || !isOrderPaymentSettled(order.paymentStatus)) {
    const err = new Error("Payment not confirmed for this ticket.");
    err.status = 400;
    throw err;
  }

  ticket.checkedIn = true;
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = adminId || null;
  await ticket.save();

  const CheckoutFormResponse = (await import("../models/CheckoutFormResponse.js")).default;
  const response = await CheckoutFormResponse.findOne({ orderId: ticket.orderId }).lean();
  const checkInAnswers = (response?.answers || [])
    .filter((a) => a.visibility?.showInCheckIn)
    .map((a) => ({ label: a.questionLabel, answer: a.answer }));

  return {
    success: true,
    ticket: formatTicket(ticket),
    order: formatOrder(order),
    event: {
      title: event?.title,
      date: event?.date,
      startTime: event?.startTime,
      venueName: event?.venueName,
      venueAddress: event?.venueAddress,
    },
    checkInAnswers,
  };
}

export async function resendTicketEmail(ticketId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  const [order, event] = await Promise.all([
    TicketOrder.findById(ticket.orderId),
    Event.findById(ticket.eventId).lean(),
  ]);
  if (!order || !isOrderPaymentSettled(order.paymentStatus)) {
    const err = new Error("Cannot resend email for unpaid ticket.");
    err.status = 400;
    throw err;
  }
  await sendTicketConfirmationEmail({ order, ticket, event });
  return { sent: true };
}

export async function getTicketPdfBuffer(ticketNumber) {
  const ticket = await Ticket.findOne({ ticketNumber }).lean();
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }

  const [order, event] = await Promise.all([
    TicketOrder.findById(ticket.orderId).lean(),
    Event.findById(ticket.eventId).lean(),
  ]);

  const { generateTicketPdfFromDocs } = await import("./ticketPdfService.js");
  return generateTicketPdfFromDocs(ticket, order, event);
}

/** Public PDF download — requires matching verification token. */
export async function getTicketPdfBufferPublic(ticketNumber, verificationToken) {
  const ticket = await Ticket.findOne({ ticketNumber }).lean();
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  verifyTicketPdfAccess(ticket, verificationToken);
  return getTicketPdfBuffer(ticketNumber);
}

export async function exportTicketsCsv(filters = {}) {
  const { tickets } = await listAdminTickets({ ...filters, limit: 10000 });
  const headers = [
    "Ticket ID",
    "Order ID",
    "Event",
    "Ticket Type",
    "Attendee",
    "Email",
    "Section",
    "Row",
    "Seat",
    "Seat Category",
    "Payment Status",
    "Checked In",
    "Created",
  ];
  const rows = tickets.map((t) => [
    t.ticketNumber,
    t.order?.orderNumber || "",
    t.eventTitle,
    t.ticketTypeName,
    t.attendeeName,
    t.attendeeEmail,
    t.section || "",
    t.row || "",
    t.seatNumber || t.seatLabel || "",
    t.seatCategory || "",
    t.order?.paymentStatus || "",
    t.checkedIn ? "Yes" : "No",
    t.createdAt ? new Date(t.createdAt).toISOString() : "",
  ]);

  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}
