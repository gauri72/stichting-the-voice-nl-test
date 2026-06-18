import TicketOrder from "../models/TicketOrder.js";
import Ticket from "../models/Ticket.js";
import TicketType from "../models/TicketType.js";
import Voucher from "../models/Voucher.js";
import Event from "../models/Event.js";
import { getNextSequence } from "../utils/sequence.js";
import { getPublishedEventBySlugOrId, generateVerificationToken } from "./eventService.js";
import {
  getMembershipDiscountPercent,
  validateVoucher,
  applyVoucherDiscount,
  applyMembershipDiscount,
  buildOrderSummary,
  formatMoney,
} from "./ticketPricingService.js";
import { buildTicketQrPath } from "./ticketQrService.js";
import { sendTicketConfirmationEmail } from "./ticketMailer.js";
import { createTicketPaymentIntent, confirmTicketPayment } from "./ticketPaymentService.js";

async function buildOrderNumber() {
  const seq = await getNextSequence("ticket_order");
  const year = new Date().getFullYear();
  return `VOICE-${year}-${String(seq).padStart(6, "0")}`;
}

async function buildTicketNumber() {
  const seq = await getNextSequence("ticket");
  const year = new Date().getFullYear();
  return `TKT-${year}-${String(seq).padStart(6, "0")}`;
}

export async function quoteOrder(eventId, { items, voucherCode, userId }) {
  const event = await getPublishedEventBySlugOrId(eventId);
  if (!event.salesEnabled) {
    const err = new Error("Ticket sales are not enabled for this event.");
    err.status = 400;
    throw err;
  }

  const lineItems = [];
  let subtotalMinor = 0;

  for (const item of items || []) {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!tt) {
      const err = new Error("Invalid ticket type selected.");
      err.status = 400;
      throw err;
    }
    if (tt.status === "sold_out") {
      const err = new Error(`${tt.name} is sold out.`);
      err.status = 400;
      throw err;
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (qty > tt.maxPerOrder) {
      const err = new Error(`Maximum ${tt.maxPerOrder} tickets per order for ${tt.name}.`);
      err.status = 400;
      throw err;
    }
    if (qty > tt.available) {
      const err = new Error(`Only ${tt.available} tickets available for ${tt.name}.`);
      err.status = 400;
      throw err;
    }

    const lineTotal = tt.priceMinor * qty;
    subtotalMinor += lineTotal;
    lineItems.push({
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      quantity: qty,
      unitPriceMinor: tt.priceMinor,
    });
  }

  if (!lineItems.length) {
    const err = new Error("Select at least one ticket.");
    err.status = 400;
    throw err;
  }

  const membershipPercent = await getMembershipDiscountPercent(userId);
  let voucher = null;
  if (voucherCode?.trim()) {
    voucher = await validateVoucher(voucherCode, event.id);
  }

  const membershipDiscountMinor = applyMembershipDiscount(subtotalMinor, membershipPercent);
  const remaining = subtotalMinor - membershipDiscountMinor;
  const voucherDiscountMinor = voucher ? applyVoucherDiscount(remaining, voucher) : 0;

  const summary = buildOrderSummary({
    subtotalMinor,
    bookingFeeMinor: event.bookingFeeMinor || 0,
    membershipDiscountMinor,
    voucherDiscountMinor,
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      venueName: event.venueName,
    },
    lineItems,
    membershipDiscountPercent: membershipPercent,
    voucherCode: voucher?.code || "",
    summary: {
      ...summary,
      subtotal: formatMoney(summary.subtotalMinor),
      bookingFee: formatMoney(summary.bookingFeeMinor),
      discount: formatMoney(summary.discountAmountMinor),
      vat: formatMoney(summary.vatAmountMinor),
      total: formatMoney(summary.totalAmountMinor),
    },
  };
}

export async function createCheckout(eventId, payload, userId) {
  const {
    items,
    attendeeFirstName,
    attendeeLastName,
    attendeeEmail,
    attendeePhone,
    voucherCode,
    termsAccepted,
  } = payload;

  if (!attendeeFirstName?.trim() || !attendeeLastName?.trim() || !attendeeEmail?.trim()) {
    const err = new Error("Attendee first name, last name, and email are required.");
    err.status = 400;
    throw err;
  }
  if (!termsAccepted) {
    const err = new Error("You must accept the terms and conditions.");
    err.status = 400;
    throw err;
  }

  const quote = await quoteOrder(eventId, { items, voucherCode, userId });
  const orderNumber = await buildOrderNumber();

  const order = await TicketOrder.create({
    orderNumber,
    userId: userId || null,
    eventId: quote.event.id,
    attendeeFirstName: attendeeFirstName.trim(),
    attendeeLastName: attendeeLastName.trim(),
    attendeeEmail: attendeeEmail.trim().toLowerCase(),
    attendeePhone: String(attendeePhone || "").trim(),
    lineItems: quote.lineItems,
    subtotalMinor: quote.summary.subtotalMinor,
    discountAmountMinor: quote.summary.discountAmountMinor,
    bookingFeeMinor: quote.summary.bookingFeeMinor,
    vatAmountMinor: quote.summary.vatAmountMinor,
    totalAmountMinor: quote.summary.totalAmountMinor,
    voucherCode: quote.voucherCode,
    membershipDiscountPercent: quote.membershipDiscountPercent,
    paymentStatus: "pending",
    termsAccepted: true,
  });

  const payment = await createTicketPaymentIntent({
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    amountMinor: order.totalAmountMinor,
    eventTitle: quote.event.title,
  });

  order.paymentIntentId = payment.paymentIntentId;
  await order.save();

  return {
    order: formatOrder(order),
    payment,
    summary: quote.summary,
  };
}

export async function completeOrderPaymentByIntent(paymentIntentId) {
  if (!paymentIntentId) {
    const err = new Error("Payment intent ID is required.");
    err.status = 400;
    throw err;
  }

  const existing = await TicketOrder.findOne({ paymentIntentId }).lean();
  if (existing) {
    return completeOrderPayment(existing._id.toString(), paymentIntentId);
  }

  const confirmed = await confirmTicketPayment(paymentIntentId);
  if (!confirmed.success) {
    const err = new Error(confirmed.error || "Payment not found.");
    err.status = 404;
    throw err;
  }

  const orderId = confirmed.intent?.metadata?.order_id;
  if (!orderId) {
    const err = new Error("Order not found for this payment.");
    err.status = 404;
    throw err;
  }

  return completeOrderPayment(orderId, paymentIntentId);
}

export async function completeOrderPayment(orderId, paymentIntentId) {
  const existingTickets = await Ticket.find({ orderId }).sort({ createdAt: 1 }).lean();
  if (existingTickets.length > 0) {
    const order = await TicketOrder.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }
    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      await order.save();
    }
    return {
      order: formatOrder(order),
      tickets: existingTickets.map(formatTicket),
      alreadyPaid: true,
    };
  }

  const order = await TicketOrder.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $in: ["pending", "failed"] } },
    { $set: { paymentStatus: "processing" } },
    { new: true }
  );

  if (!order) {
    const settled = await TicketOrder.findById(orderId);
    if (!settled) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }
    if (settled.paymentStatus === "paid") {
      const tickets = await Ticket.find({ orderId: settled._id }).lean();
      return {
        order: formatOrder(settled),
        tickets: tickets.map(formatTicket),
        alreadyPaid: true,
      };
    }
    const err = new Error("This order is already being processed. Please wait a moment.");
    err.status = 409;
    throw err;
  }

  const confirmed = await confirmTicketPayment(paymentIntentId || order.paymentIntentId);
  if (!confirmed.success) {
    order.paymentStatus = "failed";
    await order.save();
    const err = new Error(confirmed.error || "Payment failed.");
    err.status = 400;
    throw err;
  }

  const event = await Event.findById(order.eventId).lean();
  const tickets = [];

  for (const line of order.lineItems) {
    const tt = await TicketType.findById(line.ticketTypeId);
    if (!tt) continue;

    const available = tt.capacity - (tt.soldCount || 0);
    if (available < line.quantity) {
      order.paymentStatus = "failed";
      await order.save();
      const err = new Error(`Not enough tickets available for ${line.ticketTypeName}.`);
      err.status = 400;
      throw err;
    }

    for (let i = 0; i < line.quantity; i += 1) {
      const verificationToken = generateVerificationToken();
      const ticketNumber = await buildTicketNumber();
      const attendeeName = `${order.attendeeFirstName} ${order.attendeeLastName}`.trim();

      const ticket = await Ticket.create({
        ticketNumber,
        orderId: order._id,
        eventId: order.eventId,
        ticketTypeId: line.ticketTypeId,
        ticketTypeName: line.ticketTypeName,
        attendeeName,
        attendeeEmail: order.attendeeEmail,
        verificationToken,
        qrCodeUrl: buildTicketQrPath(verificationToken),
        pdfUrl: `/api/tickets/${ticketNumber}/pdf`,
        status: "valid",
      });
      tickets.push(ticket);
    }

    tt.soldCount = (tt.soldCount || 0) + line.quantity;
    if (tt.soldCount >= tt.capacity) tt.status = "sold_out";
    await tt.save();
  }

  if (order.voucherCode) {
    await Voucher.findOneAndUpdate(
      { code: order.voucherCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  order.paymentStatus = "paid";
  await order.save();

  for (const ticket of tickets) {
    try {
      await sendTicketConfirmationEmail({
        order,
        ticket,
        event,
      });
    } catch (err) {
      console.error("[tickets] confirmation email failed:", err.message);
    }
  }

  return {
    order: formatOrder(order),
    tickets: tickets.map(formatTicket),
  };
}

export function formatOrder(order) {
  if (!order) return null;
  return {
    id: order._id?.toString() || order.id,
    orderNumber: order.orderNumber,
    userId: order.userId?.toString?.() || order.userId || null,
    eventId: order.eventId?.toString?.() || order.eventId,
    attendeeFirstName: order.attendeeFirstName,
    attendeeLastName: order.attendeeLastName,
    attendeeEmail: order.attendeeEmail,
    attendeePhone: order.attendeePhone,
    attendeeName: `${order.attendeeFirstName} ${order.attendeeLastName}`.trim(),
    lineItems: order.lineItems,
    subtotalMinor: order.subtotalMinor,
    discountAmountMinor: order.discountAmountMinor,
    bookingFeeMinor: order.bookingFeeMinor,
    vatAmountMinor: order.vatAmountMinor,
    totalAmountMinor: order.totalAmountMinor,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    subtotal: formatMoney(order.subtotalMinor),
    discount: formatMoney(order.discountAmountMinor),
    bookingFee: formatMoney(order.bookingFeeMinor),
    vat: formatMoney(order.vatAmountMinor),
    total: formatMoney(order.totalAmountMinor),
  };
}

function normalizeTicketQrPath(qrCodeUrl, verificationToken) {
  const match = String(qrCodeUrl || "").match(/\/api\/tickets\/qr\/([^/?\s"]+)\.png/i);
  if (match?.[1]) return `/api/tickets/qr/${match[1]}.png`;
  if (verificationToken) return `/api/tickets/qr/${verificationToken}.png`;
  return "";
}

export function formatTicket(ticket) {
  if (!ticket) return null;
  const verificationToken = ticket.verificationToken || "";
  const pdfFallback = ticket.ticketNumber
    ? `/api/tickets/${ticket.ticketNumber}/pdf`
    : "";
  return {
    id: ticket._id?.toString() || ticket.id,
    ticketNumber: ticket.ticketNumber,
    orderId: ticket.orderId?.toString?.() || ticket.orderId,
    eventId: ticket.eventId?.toString?.() || ticket.eventId,
    ticketTypeId: ticket.ticketTypeId?.toString?.() || ticket.ticketTypeId,
    ticketTypeName: ticket.ticketTypeName,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    verificationToken,
    qrCodeUrl: normalizeTicketQrPath(ticket.qrCodeUrl, verificationToken),
    pdfUrl: ticket.pdfUrl?.startsWith("/")
      ? ticket.pdfUrl
      : pdfFallback || ticket.pdfUrl,
    status: ticket.status,
    checkedIn: ticket.checkedIn,
    checkedInAt: ticket.checkedInAt,
    createdAt: ticket.createdAt,
  };
}

export async function getUserOrders(userId) {
  const orders = await TicketOrder.find({ userId, paymentStatus: "paid" })
    .sort({ createdAt: -1 })
    .lean();
  return orders.map(formatOrder);
}

export async function getUserTickets(userId) {
  const orders = await TicketOrder.find({ userId, paymentStatus: "paid" }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  const tickets = await Ticket.find({ orderId: { $in: orderIds } })
    .sort({ createdAt: -1 })
    .lean();
  return tickets.map(formatTicket);
}

export async function getOrderForUser(orderNumber, userId) {
  const order = await TicketOrder.findOne({ orderNumber }).lean();
  if (!order) {
    const err = new Error("Order not found.");
    err.status = 404;
    throw err;
  }
  if (order.userId && userId && order.userId.toString() !== userId.toString()) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }
  const tickets = await Ticket.find({ orderId: order._id }).lean();
  return { order: formatOrder(order), tickets: tickets.map(formatTicket) };
}
