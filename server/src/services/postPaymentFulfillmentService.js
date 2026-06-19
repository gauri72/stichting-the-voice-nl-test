import crypto from "crypto";
import mongoose from "mongoose";
import { getPlan } from "../config/membershipPlans.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import TicketType from "../models/TicketType.js";
import Event from "../models/Event.js";
import Voucher from "../models/Voucher.js";
import DiscountRule from "../models/DiscountRule.js";
import { getNextSequence } from "../utils/sequence.js";
import { generateVerificationToken } from "./eventService.js";
import { buildTicketQrPath } from "./ticketQrService.js";
import { sendTicketConfirmationEmail } from "./ticketMailer.js";
import { sendMembershipEmails } from "./membershipMailer.js";
import { buildMembershipEmailPayload } from "./membershipProvisioningService.js";
import { buildMembershipId } from "../utils/membershipId.js";
import { buildMembershipReceiptNumber } from "../utils/membershipReceiptNumber.js";
import { buildMembershipQrImageUrl } from "./membershipQrService.js";
import { recordDiscountUsage } from "./discountService.js";
import { confirmTicketPayment } from "./ticketPaymentService.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "./checkoutAuditService.js";
import {
  isOrderPaymentSettled,
  freeOrderPaymentReference,
} from "../utils/orderPaymentUtils.js";

async function buildTicketNumber() {
  const seq = await getNextSequence("ticket");
  const year = new Date().getFullYear();
  return `TKT-${year}-${String(seq).padStart(6, "0")}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function provisionMembershipFromBundleOrder({
  order,
  paymentIntentId,
  paymentMethod = "Card via Stripe",
  isFreeOrder = false,
}) {
  const membershipItem = order.membershipItems?.[0];
  if (!membershipItem) return null;

  const paymentRef = isFreeOrder
    ? `${freeOrderPaymentReference(order._id.toString())}:membership`
    : `${paymentIntentId}:membership`;
  const existing = await Member.findOne({ paymentReference: paymentRef });
  if (existing) {
    const plan = getPlan(existing.planId);
    return {
      member: existing.toObject(),
      created: false,
      emailPayload: buildMembershipEmailPayload({
        member: existing,
        plan: plan || { benefits: [] },
        intent: { id: paymentIntentId, created: Math.floor(Date.now() / 1000) },
        paymentMethod,
      }),
    };
  }

  const plan = getPlan(membershipItem.planId);
  if (!plan) throw new Error(`Unknown membership plan: ${membershipItem.planId}`);

  const email = normalizeEmail(order.attendeeEmail);
  const startDate = new Date();
  let expiryDate = membershipItem.memberUntil
    ? new Date(membershipItem.memberUntil)
    : addDays(startDate, plan.durationDays || 365);

  let memberRecord = null;
  if (membershipItem.purchaseType === "RENEWAL") {
    memberRecord = await Member.findOne({ email }).sort({ expiryDate: -1 });
    if (memberRecord) {
      const base =
        memberRecord.expiryDate > new Date() ? memberRecord.expiryDate : new Date();
      expiryDate = addDays(base, plan.durationDays || 365);
      memberRecord.expiryDate = expiryDate;
      memberRecord.membershipStatus = "active";
      memberRecord.paymentStatus = "paid";
      memberRecord.planId = plan.id;
      memberRecord.membershipType = plan.name;
      memberRecord.amountPaidMinor = membershipItem.finalPriceMinor;
      await memberRecord.save();

      if (memberRecord.userId) {
        await Membership.findOneAndUpdate(
          { userId: memberRecord.userId, active: true },
          {
            planId: plan.id,
            planName: plan.name,
            endsAt: expiryDate,
            active: true,
            feeMinor: membershipItem.finalPriceMinor,
          },
          { upsert: true }
        );
      }

      return {
        member: memberRecord.toObject(),
        created: false,
        renewed: true,
        emailPayload: buildMembershipEmailPayload({
          member: memberRecord,
          plan,
          intent: { id: paymentIntentId, created: Math.floor(Date.now() / 1000) },
          paymentMethod,
        }),
      };
    }
  }

  let userId = null;
  const emailOwner = await User.findOne({ email }).select("_id").lean();
  if (emailOwner) userId = emailOwner._id;
  else if (order.userId) userId = order.userId;

  const verificationToken = crypto.randomUUID();
  const qrCodeUrl = buildMembershipQrImageUrl(verificationToken);
  const membershipId = await buildMembershipId(plan.id, startDate);
  const receiptNumber = await buildMembershipReceiptNumber(startDate);

  const member = await Member.create({
    membershipId,
    firstName: order.attendeeFirstName,
    lastName: order.attendeeLastName,
    email,
    membershipType: plan.name,
    planId: plan.id,
    amountPaidMinor: membershipItem.finalPriceMinor,
    currency: "eur",
    startDate,
    expiryDate,
    membershipStatus: "active",
    qrCodeUrl,
    verificationToken,
    paymentReference: paymentRef,
    receiptNumber,
    userId,
  });

  if (userId) {
    await Membership.findOneAndUpdate(
      { userId, active: true },
      {
        userId,
        active: true,
        planId: plan.id,
        planName: plan.name,
        feeMinor: membershipItem.finalPriceMinor,
        currency: "eur",
        startedAt: startDate,
        endsAt: expiryDate,
        membershipNumber: membershipId,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  return {
    member: member.toObject(),
    created: true,
    emailPayload: buildMembershipEmailPayload({
      member,
      plan,
      intent: { id: paymentIntentId, created: Math.floor(Date.now() / 1000) },
      paymentMethod,
    }),
  };
}

export async function generateTicketsForOrder(order) {
  const existingTickets = await Ticket.find({ orderId: order._id }).sort({ createdAt: 1 }).lean();
  if (existingTickets.length > 0) return existingTickets;

  const event = await Event.findById(order.eventId).lean();
  const tickets = [];

  for (const line of order.lineItems) {
    const tt = await TicketType.findById(line.ticketTypeId);
    if (!tt) continue;

    const available = tt.capacity - (tt.soldCount || 0);
    if (available < line.quantity) {
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

      await logCheckoutAction({
        action: CHECKOUT_AUDIT_ACTIONS.TICKET_GENERATED,
        orderId: order.orderNumber,
        userId: order.userId,
        email: order.attendeeEmail,
        eventId: order.eventId,
        details: { ticketNumber },
      });
    }

    tt.soldCount = (tt.soldCount || 0) + line.quantity;
    if (tt.soldCount >= tt.capacity) tt.status = "sold_out";
    await tt.save();
  }

  return { tickets, event };
}

export async function recordOrderDiscountUsage(order) {
  if (order.voucherCode) {
    await Voucher.findOneAndUpdate(
      { code: order.voucherCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  if (order.memberDiscountRuleId && order.membershipDiscountMinor > 0) {
    const memberRule = await DiscountRule.findById(order.memberDiscountRuleId).lean();
    if (memberRule) {
      await recordDiscountUsage({
        discountRule: { ...memberRule, id: memberRule._id.toString() },
        userId: order.userId,
        userEmail: order.attendeeEmail,
        orderId: order.orderNumber,
        eventId: order.eventId,
        subtotalBeforeDiscount: order.subtotalMinor,
        discountAmount: order.membershipDiscountMinor,
        totalAfterDiscount: order.totalAmountMinor,
      }).catch((err) => console.error("[discounts] member usage record failed:", err.message));
    }
  }

  if (
    order.discountRuleId &&
    order.voucherDiscountMinor + order.referralDiscountMinor + order.personalDiscountMinor > 0
  ) {
    const codeRule = await DiscountRule.findById(order.discountRuleId).lean();
    if (codeRule) {
      await recordDiscountUsage({
        discountRule: { ...codeRule, id: codeRule._id.toString() },
        userId: order.userId,
        userEmail: order.attendeeEmail,
        orderId: order.orderNumber,
        eventId: order.eventId,
        subtotalBeforeDiscount: order.subtotalMinor - order.membershipDiscountMinor,
        discountAmount:
          order.voucherDiscountMinor + order.referralDiscountMinor + order.personalDiscountMinor,
        totalAfterDiscount: order.totalAmountMinor,
      }).catch((err) => console.error("[discounts] code usage record failed:", err.message));
    }
  }
}

const emailedTicketOrders = new Set();
const emailedMembershipOrders = new Set();

export async function sendTicketEmailsForOrder(order, tickets, event) {
  const key = `ticket:${order.orderNumber}`;
  if (emailedTicketOrders.has(key)) return;
  emailedTicketOrders.add(key);

  for (const ticket of tickets) {
    try {
      await sendTicketConfirmationEmail({ order, ticket, event });
      await logCheckoutAction({
        action: CHECKOUT_AUDIT_ACTIONS.TICKET_EMAIL_SENT,
        orderId: order.orderNumber,
        email: order.attendeeEmail,
        details: { ticketNumber: ticket.ticketNumber },
      });
    } catch (err) {
      console.error("[fulfillment] ticket email failed:", err.message);
    }
  }
}

export async function sendMembershipEmailForOrder(order, membershipResult, paymentIntentId) {
  if (!membershipResult?.emailPayload) return;
  const key = `membership:${order.orderNumber}`;
  if (emailedMembershipOrders.has(key)) return;
  emailedMembershipOrders.add(key);

  try {
    await sendMembershipEmails({
      paymentIntentId: paymentIntentId || order.paymentIntentId,
      emailPayload: membershipResult.emailPayload,
      memberEmail: membershipResult.member.email,
    });
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBERSHIP_EMAIL_SENT,
      orderId: order.orderNumber,
      email: order.attendeeEmail,
      details: { membershipId: membershipResult.member.membershipId },
    });
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBERSHIP_GENERATED,
      orderId: order.orderNumber,
      email: order.attendeeEmail,
      details: { membershipId: membershipResult.member.membershipId },
    });
  } catch (err) {
    console.error("[fulfillment] membership email failed:", err.message);
  }
}

export async function fulfillOrder(orderId, paymentIntentId, options = {}) {
  const { isFreeOrder = false } = options;
  const TicketOrder = (await import("../models/TicketOrder.js")).default;
  const existingTickets = await Ticket.find({ orderId }).sort({ createdAt: 1 }).lean();

  if (existingTickets.length > 0) {
    const order = await TicketOrder.findById(orderId);
    if (!order) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }
    if (!isOrderPaymentSettled(order.paymentStatus)) {
      order.paymentStatus = isFreeOrder ? "free" : "paid";
      order.orderStatus = "COMPLETED";
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
    { $set: { paymentStatus: "processing", orderStatus: "PROCESSING" } },
    { new: true }
  );

  if (!order) {
    const settled = await TicketOrder.findById(orderId);
    if (!settled) {
      const err = new Error("Order not found.");
      err.status = 404;
      throw err;
    }
    if (isOrderPaymentSettled(settled.paymentStatus)) {
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

  if (!isFreeOrder) {
    const confirmed = await confirmTicketPayment(paymentIntentId || order.paymentIntentId);
    if (!confirmed.success) {
      order.paymentStatus = "failed";
      order.orderStatus = "PENDING";
      await order.save();
      const err = new Error(confirmed.error || "Payment failed.");
      err.status = 400;
      throw err;
    }
  }

  const { tickets, event } = await generateTicketsForOrder(order);
  await recordOrderDiscountUsage(order);

  let membershipResult = null;
  if (order.orderType === "TICKET_AND_MEMBERSHIP" && order.membershipItems?.length) {
    membershipResult = await provisionMembershipFromBundleOrder({
      order,
      paymentIntentId: isFreeOrder
        ? freeOrderPaymentReference(order._id.toString())
        : paymentIntentId || order.paymentIntentId,
      paymentMethod: isFreeOrder ? "Free booking (100% discount)" : "Card via Stripe",
      isFreeOrder,
    });
  }

  order.paymentStatus = isFreeOrder ? "free" : "paid";
  order.orderStatus = "COMPLETED";
  await order.save();

  await sendTicketEmailsForOrder(order, tickets, event);

  if (membershipResult) {
    await sendMembershipEmailForOrder(
      order,
      membershipResult,
      paymentIntentId || order.paymentIntentId
    );
  }

  await logCheckoutAction({
    action: isFreeOrder
      ? CHECKOUT_AUDIT_ACTIONS.FREE_ORDER_COMPLETED
      : CHECKOUT_AUDIT_ACTIONS.CHECKOUT_COMPLETED,
    orderId: order.orderNumber,
    userId: order.userId,
    email: order.attendeeEmail,
    eventId: order.eventId,
    details: {
      orderType: order.orderType,
      ticketCount: tickets.length,
      hasMembership: Boolean(membershipResult),
      isFreeOrder,
    },
  });

  return {
    order: formatOrder(order),
    tickets: tickets.map(formatTicket),
    membership: membershipResult?.member || null,
  };
}
