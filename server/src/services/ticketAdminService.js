import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import TicketType from "../models/TicketType.js";
import Event from "../models/Event.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { isOrderPaymentSettled } from "../utils/orderPaymentUtils.js";
import { verifyTicketPdfAccess } from "../utils/ticketPdfAccess.js";
import { formatMoney } from "./ticketPricingService.js";
import { sendTicketConfirmationEmail, sendTicketUpdateEmail } from "./ticketMailer.js";
import { escapeRegex } from "../utils/regexUtils.js";
import crypto from "crypto";
import User from "../models/User.js";
import { logAdminAction, getAuditLogsForTarget } from "./adminAuditService.js";

function ticketSnapshot(ticket) {
  const source = ticket.toObject ? ticket.toObject() : ticket;
  const {
    documentHistory,
    notificationHistory,
    transferHistory,
    ...snapshot
  } = source;
  return snapshot;
}

function ticketRecipients(ticket) {
  return [...new Set([
    ticket.attendeeEmail,
    ...(ticket.alternateEmails || []),
    ticket.partnerDetails?.email,
  ].map((email) => String(email || "").trim().toLowerCase()).filter(Boolean))];
}

function queueTicketRevision(ticket, { reason, type = "modification", adminId } = {}) {
  ticket.revisionNumber = Number(ticket.revisionNumber || 0) + 1;
  const revision = ticket.revisionNumber;
  ticket.documentHistory.push({
    revision,
    reason,
    snapshot: ticketSnapshot(ticket),
    status: "pending",
    createdBy: adminId || null,
    generatedAt: new Date(),
  });
  const document = ticket.documentHistory[ticket.documentHistory.length - 1];
  ticket.notificationHistory.push({
    revision,
    documentId: document._id,
    type,
    recipients: ticketRecipients(ticket),
    subject: `${type === "void" ? "Ticket voided" : "Updated ticket"} — ${ticket.ticketNumber}`,
    status: "pending",
    createdBy: adminId || null,
    createdAt: new Date(),
  });
  return { revision, documentId: document._id };
}

export async function listAdminTickets(filters = {}) {
  const {
    search,
    eventId,
    ticketTypeId,
    paymentStatus,
    paymentMethod,
    checkedIn,
    section,
    row,
    seatCategory,
    page = 1,
    limit = 50,
  } = filters;

  const orderFilter = {};
  if (paymentStatus) orderFilter.paymentStatus = paymentStatus;
  if (paymentMethod === "wallet") orderFilter.paymentMethod = { $in: ["wallet", "wallet_split"] };
  else if (paymentMethod) orderFilter.paymentMethod = paymentMethod;
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
  if (section) ticketFilter.section = new RegExp(escapeRegex(section.trim()), "i");
  if (row) ticketFilter.row = new RegExp(`^${escapeRegex(row.trim())}$`, "i");
  if (seatCategory) ticketFilter.seatCategory = seatCategory;

  if (search?.trim()) {
    const q = escapeRegex(search.trim());
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
  if (payload.alternateEmails !== undefined) {
    ticket.alternateEmails = [...new Set(
      (Array.isArray(payload.alternateEmails) ? payload.alternateEmails : [])
        .map((email) => String(email || "").trim().toLowerCase())
        .filter(Boolean)
    )].slice(0, 5);
  }
  if (payload.partnerDetails !== undefined) {
    const partner = payload.partnerDetails || {};
    ticket.partnerDetails = {
      name: String(partner.name || "").trim().slice(0, 160),
      email: String(partner.email || "").trim().toLowerCase().slice(0, 160),
      phone: String(partner.phone || "").trim().slice(0, 40),
      relationship: String(partner.relationship || "").trim().slice(0, 80),
    };
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

  queueTicketRevision(ticket, {
    reason: payload.status === "refunded" ? "Ticket marked as refunded" : "Ticket details modified by an administrator",
    type: "modification",
    adminId,
  });
  await ticket.save();
  await logAdminAction({
    adminId,
    action: "Ticket Details Updated",
    targetType: "ticket",
    targetId: ticket._id,
    summary: `Updated ticket ${ticket.ticketNumber}`,
    detail: {
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      alternateEmails: ticket.alternateEmails,
      partnerDetails: ticket.partnerDetails,
    },
  });
  return formatTicket(ticket);
}

export async function getAdminTicketDetail(ticketId) {
  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  const [order, event, audits] = await Promise.all([
    TicketOrder.findById(ticket.orderId).lean(),
    Event.findById(ticket.eventId).lean(),
    getAuditLogsForTarget(ticketId, 40),
  ]);
  return {
    ticket: {
      ...formatTicket(ticket),
      eventTitle: event?.title || "",
      eventDate: event?.date || null,
      order: order ? formatOrder(order) : null,
    },
    activity: audits.map((row) => ({
      id: row._id?.toString(),
      action: row.action,
      summary: row.summary,
      detail: row.detail,
      createdAt: row.createdAt,
    })),
  };
}

export async function transferAdminTicket(ticketId, payload, adminId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  if (ticket.status !== "valid") {
    const err = new Error("Only valid tickets can be transferred.");
    err.status = 409;
    throw err;
  }
  const toName = String(payload.toName || "").trim().slice(0, 160);
  const toEmail = String(payload.toEmail || "").trim().toLowerCase();
  if (!toName || !toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    const err = new Error("A valid recipient name and email are required.");
    err.status = 400;
    throw err;
  }
  if (toEmail === ticket.attendeeEmail) {
    const err = new Error("The recipient already owns this ticket.");
    err.status = 409;
    throw err;
  }

  const previous = { name: ticket.attendeeName, email: ticket.attendeeEmail };
  const recipient = await User.findOne({ email: toEmail }).select("_id").lean();
  ticket.transferHistory.push({
    fromName: previous.name,
    fromEmail: previous.email,
    toName,
    toEmail,
    reason: String(payload.reason || "").trim().slice(0, 500),
    transferredBy: adminId || null,
    transferredAt: new Date(),
  });
  ticket.attendeeName = toName;
  ticket.attendeeEmail = toEmail;
  ticket.assignedUserId = recipient?._id || null;
  ticket.transferRecipientEmail = toEmail;
  ticket.verificationToken = crypto.randomBytes(24).toString("hex");
  ticket.qrCodeUrl = `/api/tickets/qr/${ticket.verificationToken}.png`;
  ticket.pdfUrl = "";
  ticket.checkedIn = false;
  ticket.checkedInAt = null;
  ticket.checkedInBy = null;
  queueTicketRevision(ticket, {
    reason: `Ticket transferred from ${previous.email} to ${toEmail}`,
    type: "transfer",
    adminId,
  });
  await ticket.save();

  await logAdminAction({
    adminId,
    action: "Ticket Transferred",
    targetType: "ticket",
    targetId: ticket._id,
    summary: `Transferred ${ticket.ticketNumber} from ${previous.email} to ${toEmail}`,
    detail: { from: previous, to: { name: toName, email: toEmail }, reason: payload.reason || "" },
  });

  const event = await Event.findById(ticket.eventId).lean();
  if (previous.email && previous.email !== toEmail) {
    const { sendSimpleEmail } = await import("./booking/EmailNotificationService.js");
    await sendSimpleEmail({
      to: previous.email,
      subject: `Ticket transfer completed — ${ticket.ticketNumber}`,
      text: `Your ticket ${ticket.ticketNumber} for ${event?.title || "the event"} has been transferred to ${toName} (${toEmail}). The previous QR code is no longer valid.`,
      html: `<p>Your ticket <strong>${ticket.ticketNumber}</strong> for <strong>${event?.title || "the event"}</strong> has been transferred to ${toName} (${toEmail}).</p><p>The previous QR code is no longer valid.</p>`,
    }).catch(() => {});
  }
  return {
    ticket: formatTicket(ticket),
    recipientHasAccount: Boolean(recipient),
    emailStatus: "pending",
  };
}

export async function voidAdminTicket(ticketId, payload, adminId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  if (ticket.status === "voided") {
    const err = new Error("This ticket is already voided.");
    err.status = 409;
    throw err;
  }
  if (ticket.status === "refunded") {
    const err = new Error("A refunded ticket cannot be voided.");
    err.status = 409;
    throw err;
  }
  const reason = String(payload?.reason || "").trim().slice(0, 500);
  if (!reason) {
    const err = new Error("A reason is required to void a ticket.");
    err.status = 400;
    throw err;
  }
  ticket.status = "voided";
  ticket.voidedAt = new Date();
  ticket.voidedBy = adminId || null;
  ticket.voidReason = reason;
  ticket.checkedIn = false;
  ticket.checkedInAt = null;
  ticket.checkedInBy = null;
  ticket.verificationToken = crypto.randomBytes(24).toString("hex");
  ticket.qrCodeUrl = `/api/tickets/qr/${ticket.verificationToken}.png`;
  queueTicketRevision(ticket, { reason: `Ticket voided: ${reason}`, type: "void", adminId });
  await ticket.save();
  await logAdminAction({
    adminId,
    action: "Ticket Voided",
    targetType: "ticket",
    targetId: ticket._id,
    summary: `Voided ticket ${ticket.ticketNumber}`,
    detail: { reason },
  });
  return formatTicket(ticket);
}

export async function sendPendingTicketUpdate(ticketId, notificationId, adminId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  const notification = notificationId
    ? ticket.notificationHistory.id(notificationId)
    : [...ticket.notificationHistory].reverse().find((entry) => entry.status !== "sent");
  if (!notification) {
    const err = new Error("No pending ticket update email is available.");
    err.status = 409;
    throw err;
  }
  const document = ticket.documentHistory.id(notification.documentId)
    || [...ticket.documentHistory].reverse().find((entry) => entry.revision === notification.revision);
  const [order, event] = await Promise.all([
    TicketOrder.findById(ticket.orderId).lean(),
    Event.findById(ticket.eventId).lean(),
  ]);
  if (!order || !event) {
    const err = new Error("Ticket order or event could not be loaded.");
    err.status = 409;
    throw err;
  }
  const snapshot = document?.snapshot || ticketSnapshot(ticket);
  try {
    notification.status = "pending";
    const result = await sendTicketUpdateEmail({
      order,
      ticket: snapshot,
      event,
      reason: document?.reason || "Ticket details were modified.",
      recipients: notification.recipients,
      subject: notification.subject,
    });
    if (result?.skipped) {
      const err = new Error("Email delivery is not configured.");
      err.status = 503;
      throw err;
    }
    notification.status = "sent";
    notification.sentAt = new Date();
    notification.error = "";
    if (document) {
      document.status = "delivered";
      document.deliveredAt = notification.sentAt;
    }
    await ticket.save();
    await logAdminAction({
      adminId,
      action: "Ticket Update Sent",
      targetType: "ticket",
      targetId: ticket._id,
      summary: `Sent revision ${notification.revision} for ${ticket.ticketNumber}`,
      detail: { recipients: notification.recipients, notificationId: notification._id },
    });
    return { sent: true, recipients: notification.recipients, ticket: formatTicket(ticket) };
  } catch (error) {
    notification.status = "failed";
    notification.error = String(error.message || "Delivery failed").slice(0, 1000);
    await ticket.save();
    throw error;
  }
}

export async function getTicketRevisionPdfBuffer(ticketId, documentId, adminId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket not found.");
    err.status = 404;
    throw err;
  }
  const document = documentId
    ? ticket.documentHistory.id(documentId)
    : ticket.documentHistory[ticket.documentHistory.length - 1];
  const [order, event] = await Promise.all([
    TicketOrder.findById(ticket.orderId).lean(),
    Event.findById(ticket.eventId).lean(),
  ]);
  const { generateTicketPdfFromDocs } = await import("./ticketPdfService.js");
  const buffer = await generateTicketPdfFromDocs(document?.snapshot || ticket.toObject(), order, event);
  if (document && document.status === "pending") {
    document.status = "downloaded";
    document.downloadedAt = new Date();
    await ticket.save();
    await logAdminAction({
      adminId,
      action: "Ticket Revision Downloaded",
      targetType: "ticket",
      targetId: ticket._id,
      summary: `Downloaded revision ${document.revision} for ${ticket.ticketNumber}`,
      detail: { documentId: document._id },
    });
  }
  return { buffer, ticketNumber: ticket.ticketNumber, revision: document?.revision || 0 };
}

export async function checkInTicket(verificationToken, adminId) {
  const ticket = await Ticket.findOne({ verificationToken });
  if (!ticket) {
    const err = new Error("Invalid ticket. QR code not recognized.");
    err.status = 404;
    throw err;
  }

  if (ticket.status === "refunded" || ticket.status === "cancelled" || ticket.status === "voided") {
    const err = new Error("This ticket has been cancelled, refunded, or voided.");
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
