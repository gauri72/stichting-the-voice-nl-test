import crypto from "crypto";
import mongoose from "mongoose";
import { getPlan } from "../config/membershipPlans.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
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
import WaitlistEntry from "../models/WaitlistEntry.js";
import { markWaitlistConverted } from "./booking/WaitlistService.js";
import { buildMembershipQrImageUrl } from "./membershipQrService.js";
import { recordDiscountUsage } from "./discountService.js";
import { confirmTicketPayment } from "./ticketPaymentService.js";
import { formatOrder, formatTicket } from "./ticketOrderService.js";
import { getSeatMapByEventId } from "./seatService.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "./checkoutAuditService.js";
import {
  isOrderPaymentSettled,
  freeOrderPaymentReference,
} from "../utils/orderPaymentUtils.js";
import { buildTicketPdfUrl } from "../utils/ticketPdfAccess.js";
import { syncFinanceTransaction } from "./financeTransactionSyncService.js";
import { sendMembershipDiscountAppliedEmail } from "./discountMailer.js";

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

  // The unique paymentReference index on Member is the idempotency gate: if a
  // duplicate webhook/confirmation races this call, the loser returns the
  // winner's existing record instead of throwing, same pattern as
  // membershipProvisioningService.js.
  let member;
  try {
    member = await Member.create({
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
  } catch (error) {
    if (error?.code === 11000) {
      const winner = await Member.findOne({ paymentReference: paymentRef });
      if (winner) {
        const winnerPlan = getPlan(winner.planId) || plan;
        return {
          member: winner.toObject(),
          created: false,
          emailPayload: buildMembershipEmailPayload({
            member: winner,
            plan: winnerPlan,
            intent: { id: paymentIntentId, created: Math.floor(Date.now() / 1000) },
            paymentMethod,
          }),
        };
      }
    }
    throw error;
  }

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
  if (existingTickets.length > 0) return { tickets: existingTickets, event: await Event.findById(order.eventId).lean() };

  const event = await Event.findById(order.eventId).lean();
  const tickets = [];
  const selectedSeats = order.selectedSeats || [];
  let seatIndex = 0;
  const seatMapDoc = selectedSeats.length ? await getSeatMapByEventId(order.eventId) : null;
  const seatMapId = seatMapDoc?.seatMapId || "";

  for (const line of order.lineItems) {
    const reserved = await TicketType.findOneAndUpdate(
      {
        _id: line.ticketTypeId,
        $expr: {
          $lte: [
            { $add: [{ $ifNull: ["$soldCount", 0] }, line.quantity] },
            "$capacity",
          ],
        },
      },
      { $inc: { soldCount: line.quantity } },
      { new: true }
    );
    if (!reserved) {
      const tt = await TicketType.findById(line.ticketTypeId).lean();
      const err = new Error(
        `Not enough tickets available for ${line.ticketTypeName || tt?.name || "ticket type"}.`
      );
      err.status = 400;
      throw err;
    }
    if (reserved.soldCount >= reserved.capacity && reserved.status !== "sold_out") {
      await TicketType.updateOne({ _id: line.ticketTypeId }, { status: "sold_out" });
    }

    const lineSeatIds = line.seatIds?.length
      ? line.seatIds
      : selectedSeats.slice(seatIndex, seatIndex + line.quantity).map((s) => s.seatId);

    if (selectedSeats.length && lineSeatIds.length) {
      const { bookSeatsForOrder } = await import("./seatService.js");
      await bookSeatsForOrder(order, lineSeatIds);
    }

    for (let i = 0; i < line.quantity; i += 1) {
      const verificationToken = generateVerificationToken();
      const ticketNumber = await buildTicketNumber();
      const attendeeName = `${order.attendeeFirstName} ${order.attendeeLastName}`.trim();
      const seatInfo = selectedSeats[seatIndex] || null;
      seatIndex += 1;

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
        pdfUrl: buildTicketPdfUrl(ticketNumber, verificationToken),
        status: "valid",
        seatMapId: seatInfo ? seatMapId : "",
        seatId: seatInfo?.seatId || "",
        section: seatInfo?.section || "",
        row: seatInfo?.row || "",
        seatNumber: seatInfo?.seatNumber || "",
        seatLabel: seatInfo?.seatLabel || "",
        seatCategory: seatInfo?.category || "",
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

    // soldCount incremented atomically above
  }

  return { tickets, event };
}

export async function recordOrderDiscountUsage(order, event = null) {
  if (order.voucherCode) {
    const updated = await Voucher.findOneAndUpdate(
      {
        code: order.voucherCode.toUpperCase(),
        $or: [
          { usageLimit: null },
          { usageLimit: 0 },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
        ],
      },
      { $inc: { usedCount: 1 } }
    );
    if (!updated) {
      console.warn("[fulfillment] Voucher usage limit exceeded for order", order.orderNumber);
    }
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

      const discountValueLabel =
        memberRule.discountType === "free_ticket"
          ? "Free ticket"
          : memberRule.discountType === "percentage"
            ? `${memberRule.discountValue}%`
            : `€${Number(memberRule.discountValue).toFixed(2)}`;
      await sendMembershipDiscountAppliedEmail({
        email: order.attendeeEmail,
        firstName: order.attendeeFirstName,
        discountValue: discountValueLabel,
        eventName: event?.title || "",
      }).catch((err) => console.error("[discounts] membership discount email failed:", err.message));
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
  const { isFreeOrder = false, isComplimentary = false } = options;
  const resolveSettledStatus = () => (isComplimentary ? "complimentary" : isFreeOrder ? "free" : "paid");
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
      order.paymentStatus = resolveSettledStatus();
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
    { _id: orderId, paymentStatus: { $in: ["pending", "failed", "complimentary"] } },
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
      const seatIds = (order.selectedSeats || []).map((s) => s.seatId).filter(Boolean);
      if (seatIds.length) {
        const { releaseSeatHolds } = await import("./seatService.js");
        await releaseSeatHolds({ eventId: order.eventId, seatIds });
      }
      const err = new Error(confirmed.error || "Payment failed.");
      err.status = 400;
      throw err;
    }

    const intent = confirmed.intent;
    if (intent) {
      const intentOrderId = intent.metadata?.order_id;
      if (intentOrderId && intentOrderId !== order._id.toString()) {
        order.paymentStatus = "failed";
        order.orderStatus = "PENDING";
        await order.save();
        const err = new Error("Payment does not match this order.");
        err.status = 400;
        throw err;
      }
      if (typeof intent.amount === "number" && intent.amount !== order.totalAmountMinor) {
        order.paymentStatus = "failed";
        order.orderStatus = "PENDING";
        await order.save();
        const err = new Error("Payment amount does not match order total.");
        err.status = 400;
        throw err;
      }
    }
  }

  try {
  const { tickets, event } = await generateTicketsForOrder(order);
  await recordOrderDiscountUsage(order, event);

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

  order.paymentStatus = resolveSettledStatus();
  order.orderStatus = "COMPLETED";
  await order.save();

  // If this buyer was previously notified that a waitlist spot opened up for
  // one of these ticket types, mark that entry converted now that they've
  // actually completed a booking.
  const waitlistTicketTypeIds = [...new Set((order.lineItems || []).map((item) => String(item.ticketTypeId)))];
  if (waitlistTicketTypeIds.length) {
    const notifiedEntries = await WaitlistEntry.find({
      resourceType: "ticket_type",
      resourceId: { $in: waitlistTicketTypeIds },
      email: order.attendeeEmail,
      status: "notified",
    }).lean();
    for (const entry of notifiedEntries) {
      await markWaitlistConverted(entry.waitlistId, order._id.toString());
    }
  }

  if (!isFreeOrder && order.totalAmountMinor > 0) {
    await syncFinanceTransaction({
      category: order.orderType === "MEMBERSHIP_ONLY" ? "membership_revenue" : "ticket_sales",
      description: `Order ${order.orderNumber} — ${event?.title || "Event"}`,
      relatedModule: "tickets",
      relatedRecordId: order.orderNumber,
      relatedEventId: order.eventId,
      relatedEventName: event?.title || "",
      amount: order.totalAmountMinor,
      paymentMethod: "Card via Stripe",
      paymentReference: paymentIntentId || order.paymentIntentId,
      transactionDate: new Date(),
    });
  }

  await sendTicketEmailsForOrder(order, tickets, event);

  try {
    const { notifyAdminTicketBooking } = await import("./booking/AdminNotificationService.js");
    const { logUserBookingActivity } = await import("./booking/ActivityLogService.js");
    await notifyAdminTicketBooking({
      order,
      event,
      tickets,
      paymentStatus: resolveSettledStatus(),
    });
    if (order.userId) {
      await logUserBookingActivity({
        userId: order.userId,
        kind: "ticket_purchased",
        summary: `Purchased tickets for ${event?.title || "event"}`,
        detail: order.orderNumber,
      });
    }
  } catch (notifyErr) {
    console.warn("[fulfillment] Admin/activity notification failed:", notifyErr.message);
  }

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
  } catch (fulfillmentError) {
    await TicketOrder.findByIdAndUpdate(orderId, {
      $set: { paymentStatus: "failed", orderStatus: "PENDING" },
    });
    const seatIds = (order.selectedSeats || []).map((s) => s.seatId).filter(Boolean);
    if (seatIds.length) {
      try {
        const { releaseSeatHolds } = await import("./seatService.js");
        await releaseSeatHolds({ eventId: order.eventId, seatIds });
      } catch {
        /* best effort */
      }
    }
    console.error("[fulfillment] Order fulfillment failed:", fulfillmentError.message);
    throw fulfillmentError;
  }
}
