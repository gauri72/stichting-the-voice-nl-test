import TicketOrder from "../models/TicketOrder.js";
import Ticket from "../models/Ticket.js";
import { getPublishedEventBySlugOrId } from "./eventService.js";
import {
  buildOrderSummary,
  formatMoney,
  applyDiscountsToOrder,
} from "./ticketPricingService.js";
import { sanitizeCustomerDiscountLabel } from "../utils/membershipDisplayLabels.js";
import { confirmTicketPayment } from "./ticketPaymentService.js";

export async function quoteOrder(eventId, { items, voucherCode, discountCode, userId, email }) {
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

  const code = discountCode || voucherCode;
  const discountResult = await applyDiscountsToOrder({
    userId,
    email,
    eventId: event.id,
    orderType: "tickets",
    subtotalMinor,
    discountCode: code,
    voucherCode: code,
  });

  const summary = buildOrderSummary({
    subtotalMinor,
    bookingFeeMinor: event.bookingFeeMinor || 0,
    membershipDiscountMinor: discountResult.memberDiscountMinor,
    voucherDiscountMinor: discountResult.voucherDiscountMinor,
    referralDiscountMinor: discountResult.referralDiscountMinor,
    personalDiscountMinor: discountResult.personalDiscountMinor,
  });

  const membershipPercent =
    discountResult.memberRule?.discountType === "percentage"
      ? discountResult.memberRule.discountValue
      : discountResult.memberDiscountMinor >= subtotalMinor
        ? 100
        : 0;

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
    memberDiscountLabel: sanitizeCustomerDiscountLabel(discountResult.memberLabel || ""),
    voucherCode: discountResult.codeRule?.isLegacyVoucher ? discountResult.codeRule.code : "",
    discountCode: discountResult.codeRule && !discountResult.codeRule.isLegacyVoucher ? discountResult.codeRule.code : "",
    referralCode: discountResult.codeRule?.type === "referral_code" ? discountResult.codeRule.code : "",
    codeDiscountLabel: discountResult.codeLabel || "",
    discountResult,
    summary: {
      ...summary,
      subtotal: formatMoney(summary.subtotalMinor),
      bookingFee: formatMoney(summary.bookingFeeMinor),
      memberDiscount: formatMoney(summary.membershipDiscountMinor),
      voucherDiscount: formatMoney(summary.voucherDiscountMinor + summary.personalDiscountMinor),
      referralDiscount: formatMoney(summary.referralDiscountMinor),
      discount: formatMoney(summary.discountAmountMinor),
      vat: formatMoney(summary.vatAmountMinor),
      total: formatMoney(summary.totalAmountMinor),
    },
  };
}

export async function createCheckout(eventId, payload, userId) {
  const { createBundleCheckout } = await import("./checkoutBundleService.js");
  return createBundleCheckout(eventId, payload, userId);
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
  const { fulfillOrder } = await import("./postPaymentFulfillmentService.js");
  const order = await TicketOrder.findById(orderId).select("totalAmountMinor").lean();
  const isFreeOrder = !order || order.totalAmountMinor <= 0;
  return fulfillOrder(orderId, paymentIntentId, { isFreeOrder });
}

export function formatOrder(order) {
  if (!order) return null;
  return {
    id: order._id?.toString() || order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType || "TICKET_ONLY",
    userId: order.userId?.toString?.() || order.userId || null,
    eventId: order.eventId?.toString?.() || order.eventId,
    attendeeFirstName: order.attendeeFirstName,
    attendeeLastName: order.attendeeLastName,
    attendeeEmail: order.attendeeEmail,
    attendeePhone: order.attendeePhone,
    attendeeName: `${order.attendeeFirstName} ${order.attendeeLastName}`.trim(),
    lineItems: order.lineItems,
    membershipItems: order.membershipItems || [],
    appliedDiscounts: order.appliedDiscounts || [],
    memberStatusAtCheckout: order.memberStatusAtCheckout || "",
    membershipBenefitApplied: Boolean(order.membershipBenefitApplied),
    totalSavingsMinor: order.totalSavingsMinor || 0,
    subtotalMinor: order.subtotalMinor,
    discountAmountMinor: order.discountAmountMinor,
    bookingFeeMinor: order.bookingFeeMinor,
    vatAmountMinor: order.vatAmountMinor,
    totalAmountMinor: order.totalAmountMinor,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus || "PENDING",
    isFreeBooking: order.paymentStatus === "free" || order.totalAmountMinor <= 0,
    createdAt: order.createdAt,
    subtotal: formatMoney(order.subtotalMinor),
    discount: formatMoney(order.discountAmountMinor),
    bookingFee: formatMoney(order.bookingFeeMinor),
    vat: formatMoney(order.vatAmountMinor),
    total: formatMoney(order.totalAmountMinor),
    totalSavings: formatMoney(order.totalSavingsMinor || 0),
    selectedSeats: order.selectedSeats || [],
    seatingMode: order.seatingMode || "general_admission",
    checkoutFormResponseId: order.checkoutFormResponseId || "",
    checkoutAnswers: order.checkoutAnswers || [],
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
    seatMapId: ticket.seatMapId || "",
    seatId: ticket.seatId || "",
    section: ticket.section || "",
    row: ticket.row || "",
    seatNumber: ticket.seatNumber || "",
    seatLabel: ticket.seatLabel || "",
    seatCategory: ticket.seatCategory || "",
  };
}

export async function getUserOrders(userId) {
  const orders = await TicketOrder.find({ userId, paymentStatus: { $in: ["paid", "free"] } })
    .sort({ createdAt: -1 })
    .lean();
  return orders.map(formatOrder);
}

export async function getUserTickets(userId) {
  const orders = await TicketOrder.find({ userId, paymentStatus: { $in: ["paid", "free"] } }).select("_id").lean();
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
