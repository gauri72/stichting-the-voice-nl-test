import mongoose from "mongoose";
import TicketType from "../models/TicketType.js";
import User from "../models/User.js";
import TicketOrder from "../models/TicketOrder.js";
import PendingWalletBooking from "../models/PendingWalletBooking.js";
import AIBookingLog from "../models/AIBookingLog.js";
import { listEvents } from "./eventService.js";
import { calculatePricePreview } from "./pricePreviewService.js";
import { fulfillOrder } from "./postPaymentFulfillmentService.js";
import { debitWallet, creditWallet, awardPoints, computePointsForSpend, getOrCreateWallet, getOrCreateWalletSettings } from "./walletService.js";
import { sendAiBookingConfirmationEmail } from "./walletMailer.js";
import { sendPush } from "./webPushService.js";
import PushSubscription from "../models/PushSubscription.js";
import { getNextSequence } from "../utils/sequence.js";

const QUOTE_TTL_MS = 10 * 60 * 1000;

function toolError(message) {
  // Returned as a tool_result, not thrown — Claude needs to see this text to
  // explain the problem to the customer, not have the whole turn crash.
  return { error: message };
}

/** Tool 1 — read-only. Claude calls this to search published events for the customer's request. */
export async function findEvents({ query = "", dateFrom = null, dateTo = null } = {}) {
  const events = await listEvents({ status: "published" });
  const now = new Date();
  const from = dateFrom ? new Date(dateFrom) : now;
  const to = dateTo ? new Date(dateTo) : null;
  const needle = query.trim().toLowerCase();

  const matches = events
    .filter((e) => new Date(e.date) >= from && (!to || new Date(e.date) <= to))
    .filter((e) => !needle || `${e.title} ${e.venueName || ""}`.toLowerCase().includes(needle))
    .slice(0, 8);

  const results = [];
  for (const event of matches) {
    const ticketTypes = await TicketType.find({ eventId: event.id, status: { $ne: "hidden" }, salesEnabled: true }).lean();
    results.push({
      eventId: event.id,
      title: event.title,
      date: event.date,
      venue: event.venueName,
      ticketTypes: ticketTypes.map((tt) => ({
        ticketTypeId: tt._id.toString(),
        name: tt.name,
        priceMinor: tt.priceMinor,
        available: Math.max(0, tt.capacity - tt.soldCount),
      })),
    });
  }
  return { events: results };
}

/**
 * Tool 2 — validates pricing/availability and the customer's wallet settings
 * and balance, then writes a short-lived quote. No money moves here.
 */
export async function prepareWalletBooking(customerId, { eventId, ticketTypeId, quantity = 1 }) {
  const settings = await getOrCreateWalletSettings(customerId);
  if (!settings.aiBookingEnabled) {
    return toolError("AI booking is not enabled on this account. The customer needs to turn it on in V.Wallet settings first.");
  }

  const user = await User.findById(customerId).lean();
  if (!user) return toolError("Customer account not found.");

  let preview;
  try {
    preview = await calculatePricePreview({
      eventId,
      items: [{ ticketTypeId, quantity }],
      userId: customerId,
      email: user.email,
      isLoggedIn: true,
      includeMembership: false,
    });
  } catch (e) {
    return toolError(e.message || "Could not price this booking.");
  }

  const totalAmountMinor = preview.combined.grandTotalMinor;

  if (totalAmountMinor > settings.maxAISpendPerTransactionMinor) {
    return toolError(
      `This booking (€${(totalAmountMinor / 100).toFixed(2)}) exceeds the customer's per-transaction AI spend limit of €${(settings.maxAISpendPerTransactionMinor / 100).toFixed(2)}.`
    );
  }

  const spentToday = await aiSpendToday(customerId);
  if (spentToday + totalAmountMinor > settings.dailyAISpendLimitMinor) {
    return toolError(
      `This booking would exceed the customer's daily AI spend limit of €${(settings.dailyAISpendLimitMinor / 100).toFixed(2)} (already used €${(spentToday / 100).toFixed(2)} today).`
    );
  }

  const wallet = await getOrCreateWallet(customerId);
  if (wallet.balanceMinor < totalAmountMinor) {
    return toolError(
      `Insufficient V.Wallet balance: this booking costs €${(totalAmountMinor / 100).toFixed(2)} but the wallet only has €${(wallet.balanceMinor / 100).toFixed(2)}. Suggest the customer top up their wallet.`
    );
  }

  const pending = await PendingWalletBooking.create({
    customerId,
    eventId,
    ticketTypeId,
    quantity,
    totalAmountMinor,
    status: "quoted",
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
  });

  await AIBookingLog.create({
    customerId,
    eventId,
    ticketTypeId,
    quantity,
    totalAmountMinor,
    status: settings.confirmationStepEnabled ? "awaiting_confirmation" : "quoted",
  });

  return {
    bookingIntentId: pending._id.toString(),
    eventTitle: preview.event.title,
    eventDate: preview.event.date,
    ticketTypeName: preview.ticketPricing.lineItems[0]?.ticketTypeName,
    quantity,
    totalAmountMinor,
    walletBalanceAfterMinor: wallet.balanceMinor - totalAmountMinor,
    confirmationRequired: settings.confirmationStepEnabled,
  };
}

async function aiSpendToday(customerId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await AIBookingLog.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: "confirmed", confirmedAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
  ]);
  return result[0]?.total || 0;
}

/**
 * Tool 3 — actually moves money. Independently re-validates everything
 * server-side regardless of what Claude/the conversation decided; this is
 * the hard security backstop the spec requires.
 */
export async function executeWalletBooking(customerId, { bookingIntentId }) {
  const pending = await PendingWalletBooking.findOne({ _id: bookingIntentId, customerId });
  if (!pending) return toolError("This booking quote was not found. Ask the customer to start over.");
  if (pending.status !== "quoted") return toolError("This booking quote has already been used or is no longer valid.");
  if (pending.expiresAt < new Date()) {
    pending.status = "expired";
    await pending.save();
    return toolError("This booking quote has expired (quotes are valid for 10 minutes). Please get a fresh quote.");
  }

  // Re-validate everything server-side — never trust that the conversation
  // alone is sufficient authorization to actually spend money.
  const settings = await getOrCreateWalletSettings(customerId);
  if (!settings.aiBookingEnabled) return toolError("AI booking permission has been revoked.");
  if (pending.totalAmountMinor > settings.maxAISpendPerTransactionMinor) {
    return toolError("This booking now exceeds the per-transaction AI spend limit.");
  }
  const spentToday = await aiSpendToday(customerId);
  if (spentToday + pending.totalAmountMinor > settings.dailyAISpendLimitMinor) {
    return toolError("This booking would exceed the daily AI spend limit.");
  }

  const user = await User.findById(customerId).lean();
  if (!user) return toolError("Customer account not found.");

  let preview;
  try {
    preview = await calculatePricePreview({
      eventId: pending.eventId,
      items: [{ ticketTypeId: pending.ticketTypeId, quantity: pending.quantity }],
      userId: customerId,
      email: user.email,
      isLoggedIn: true,
      includeMembership: false,
    });
  } catch (e) {
    return toolError(e.message || "This event or ticket type is no longer available.");
  }

  try {
    // A 100%-discounted (membership benefit) booking can legitimately total
    // €0 — debitWallet() rejects a non-positive amount outright (there's
    // nothing to debit), so skip straight to fulfillment in that case
    // instead of treating "free" as a wallet payment failure.
    if (pending.totalAmountMinor > 0) {
      await debitWallet(customerId, pending.totalAmountMinor, {
        type: "purchase",
        description: `AI-booked tickets — ${preview.event.title}`,
        referenceType: "aiBooking",
        referenceId: pending._id.toString(),
        initiatedBy: "ai",
      });
    }
  } catch (e) {
    return toolError(e.message || "Wallet payment failed.");
  }

  let order;
  try {
    const orderSeq = await getNextSequence("ticket_order");
    const orderNumber = `VOICE-${new Date().getFullYear()}-${String(orderSeq).padStart(6, "0")}`;

    order = await TicketOrder.create({
      orderNumber,
      orderType: "TICKET_ONLY",
      userId: customerId,
      eventId: preview.event.id,
      attendeeFirstName: user.firstName || "Member",
      attendeeLastName: user.lastName || "",
      attendeeEmail: user.email,
      lineItems: preview.ticketPricing.lineItems.map((li) => ({
        ...li,
        finalPriceMinor: li.finalPriceMinor ?? li.unitPriceMinor * li.quantity,
      })),
      subtotalMinor: preview.ticketPricing.subtotalMinor,
      bookingFeeMinor: preview.summary.bookingFeeMinor,
      vatAmountMinor: preview.summary.vatAmountMinor,
      totalAmountMinor: pending.totalAmountMinor,
      paymentStatus: "pending",
      paymentMethod: "wallet",
      termsAccepted: true,
      bookingMode: "ai_assistant",
    });

    await fulfillOrder(order._id, null, { isFreeOrder: true });
  } catch (e) {
    console.error("[wallet-ai-booking] booking failed after wallet debit:", e.message);
    // The wallet was already debited above — the customer must not be left
    // out of pocket for a booking that never actually went through.
    if (pending.totalAmountMinor > 0) {
      await creditWallet(customerId, pending.totalAmountMinor, {
        type: "refund",
        description: `Refund — booking could not be completed for ${preview.event.title}`,
        referenceType: "aiBooking",
        referenceId: pending._id.toString(),
        initiatedBy: "ai",
      }).catch((refundErr) => {
        console.error("[wallet-ai-booking] CRITICAL: refund after failed booking also failed:", refundErr.message);
      });
    }
    if (order) {
      await TicketOrder.findByIdAndUpdate(order._id, {
        $set: { paymentStatus: "failed", orderStatus: "PENDING" },
      }).catch(() => {});
    }
    return toolError("We couldn't complete this booking, so your V.Wallet balance has been refunded. Please try again or contact support if this keeps happening.");
  }

  const points = await computePointsForSpend(customerId, pending.totalAmountMinor);
  if (points > 0) {
    await awardPoints(customerId, points, {
      description: `Earned from AI-booked order ${order.orderNumber}`,
      referenceType: "ticketOrder",
      referenceId: order._id.toString(),
      initiatedBy: "ai",
    });
  }

  pending.status = "executed";
  await pending.save();

  await AIBookingLog.findOneAndUpdate(
    { customerId, eventId: pending.eventId, ticketTypeId: pending.ticketTypeId, status: { $in: ["quoted", "awaiting_confirmation"] } },
    { status: "confirmed", confirmedAt: new Date(), orderId: order._id },
    { sort: { createdAt: -1 } }
  );

  await notifyAiBooking(user, preview.event.title, pending.quantity, pending.totalAmountMinor);

  return {
    success: true,
    orderNumber: order.orderNumber,
    eventTitle: preview.event.title,
    quantity: pending.quantity,
    totalAmountMinor: pending.totalAmountMinor,
    pointsEarned: points,
  };
}

async function notifyAiBooking(user, eventTitle, quantity, totalAmountMinor) {
  await sendAiBookingConfirmationEmail({ to: user.email, firstName: user.firstName, eventTitle, quantity, totalAmountMinor }).catch(() => {});
  try {
    const subs = await PushSubscription.find({ customerId: user._id }).lean();
    for (const sub of subs) {
      await sendPush(sub, {
        title: "V.Assist booked your tickets",
        body: `${quantity} ticket(s) for ${eventTitle} — paid from your V.Wallet.`,
      }).catch(() => {});
    }
  } catch {
    // push is best-effort
  }
}
