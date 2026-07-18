import TicketOrder from "../models/TicketOrder.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { getPublishedEventBySlugOrId } from "./eventService.js";
import {
  buildOrderSummary,
  formatMoney,
  applyDiscountsToOrder,
} from "./ticketPricingService.js";
import { sanitizeCustomerDiscountLabel } from "../utils/membershipDisplayLabels.js";
import { confirmTicketPayment } from "./ticketPaymentService.js";
import { buildTicketPdfUrl } from "../utils/ticketPdfAccess.js";
import { validateTicketLineItems } from "./ticketTypeAdminService.js";

export async function quoteOrder(eventId, { items, voucherCode, discountCode, userId, email }) {
  const event = await getPublishedEventBySlugOrId(eventId);
  if (!event.salesEnabled) {
    const err = new Error("Ticket sales are not enabled for this event.");
    err.status = 400;
    throw err;
  }

  const lineItems = [];
  let subtotalMinor = 0;

  const validated = await validateTicketLineItems(event, items);
  const validatedLineItems = validated.lineItems;
  subtotalMinor = validated.subtotalMinor;

  for (const line of validatedLineItems) {
    lineItems.push(line);
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
    paymentMethod: order.paymentMethod || "card",
    bookingMode: order.bookingMode || "",
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
  const pdfFallback = buildTicketPdfUrl(ticket.ticketNumber, verificationToken);
  const documents = (ticket.documentHistory || []).map((entry) => ({
    id: entry._id?.toString?.() || entry.id,
    revision: entry.revision,
    reason: entry.reason || "",
    status: entry.status || "pending",
    generatedAt: entry.generatedAt,
    downloadedAt: entry.downloadedAt,
    deliveredAt: entry.deliveredAt,
  }));
  const notifications = (ticket.notificationHistory || []).map((entry) => ({
    id: entry._id?.toString?.() || entry.id,
    revision: entry.revision,
    documentId: entry.documentId?.toString?.() || entry.documentId || "",
    type: entry.type || "modification",
    recipients: entry.recipients || [],
    subject: entry.subject || "",
    status: entry.status || "pending",
    createdAt: entry.createdAt,
    sentAt: entry.sentAt,
    error: entry.error || "",
  }));
  return {
    id: ticket._id?.toString() || ticket.id,
    ticketNumber: ticket.ticketNumber,
    orderId: ticket.orderId?.toString?.() || ticket.orderId,
    eventId: ticket.eventId?.toString?.() || ticket.eventId,
    ticketTypeId: ticket.ticketTypeId?.toString?.() || ticket.ticketTypeId,
    ticketTypeName: ticket.ticketTypeName,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    alternateEmails: ticket.alternateEmails || [],
    partnerDetails: ticket.partnerDetails || {},
    assignedUserId: ticket.assignedUserId?.toString?.() || ticket.assignedUserId || "",
    transferRecipientEmail: ticket.transferRecipientEmail || "",
    transferHistory: (ticket.transferHistory || []).map((entry) => ({
      id: entry._id?.toString?.() || entry.id,
      fromName: entry.fromName || "",
      fromEmail: entry.fromEmail || "",
      toName: entry.toName || "",
      toEmail: entry.toEmail || "",
      reason: entry.reason || "",
      transferredAt: entry.transferredAt,
    })),
    revisionNumber: ticket.revisionNumber || 0,
    documentHistory: documents,
    notificationHistory: notifications,
    hasPendingDocument: documents.some((entry) => entry.status !== "delivered"),
    hasPendingNotification: notifications.some((entry) => entry.status !== "sent"),
    verificationToken,
    qrCodeUrl: normalizeTicketQrPath(ticket.qrCodeUrl, verificationToken),
    // The PDF route requires ?token= to match verificationToken (see
    // verifyTicketPdfAccess) — always derive the URL from the token rather
    // than trusting the stored ticket.pdfUrl, which on older tickets was
    // saved before token-based access existed and 403s without it.
    pdfUrl: pdfFallback || ticket.pdfUrl,
    status: ticket.status,
    voidedAt: ticket.voidedAt,
    voidReason: ticket.voidReason || "",
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
  const user = await User.findById(userId).select("email").lean();
  const orders = await TicketOrder.find({ userId, paymentStatus: { $in: ["paid", "free"] } }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  const tickets = await Ticket.find({
    $or: [
      {
        orderId: { $in: orderIds },
        assignedUserId: null,
        transferRecipientEmail: { $in: ["", null] },
      },
      { assignedUserId: userId },
      ...(user?.email ? [{ transferRecipientEmail: user.email.toLowerCase() }] : []),
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
  return tickets.map(formatTicket);
}

export async function getOrderForUser(orderNumber, userId, requesterEmail = "") {
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
  if (order.userId && !userId) {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }
  if (!order.userId) {
    const normalizedRequesterEmail = String(requesterEmail || "").trim().toLowerCase();
    if (!normalizedRequesterEmail) {
      const err = new Error("Email is required to view this order.");
      err.status = 400;
      throw err;
    }
    const normalizedAttendeeEmail = String(order.attendeeEmail || "").trim().toLowerCase();
    if (normalizedRequesterEmail !== normalizedAttendeeEmail) {
      const err = new Error("Access denied.");
      err.status = 403;
      throw err;
    }
  }
  const tickets = await Ticket.find({ orderId: order._id }).lean();
  return { order: formatOrder(order), tickets: tickets.map(formatTicket) };
}
