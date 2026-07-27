import env from "../config/env.js";
import { getStripe } from "./stripe.js";
import TicketOrder from "../models/TicketOrder.js";
import { createBundleCheckout } from "./checkoutBundleService.js";
import { fulfillOrder } from "./postPaymentFulfillmentService.js";
import { debitWallet, creditWallet, awardPoints, computePointsForSpend } from "./walletService.js";
import { applyPointsDiscount, capWalletPortion, deferWalletDebit } from "./walletSplitPaymentService.js";

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/**
 * Runs the existing, fully-validated checkout pipeline (pricing, discounts,
 * seat holds, checkout forms — everything `createBundleCheckout` already
 * does for card checkout) to get a priced, `pending` order. Membership
 * bundling is out of scope for V1 wallet checkout, so it's forced off here.
 */
async function quoteOrder(eventId, payload, userId) {
  const result = await createBundleCheckout(eventId, { ...payload, includeMembership: false }, userId);
  const order = await TicketOrder.findById(result.order.id);
  if (!order) throw err("Order could not be created.", 500);
  return { order, payment: result.payment };
}

async function cancelUnusedIntent(paymentIntentId) {
  if (!paymentIntentId) return;
  try {
    await getStripe().paymentIntents.cancel(paymentIntentId);
  } catch {
    // best-effort — an abandoned PaymentIntent simply expires on its own
  }
}

async function awardPurchasePoints(customerId, order, initiatedBy) {
  const points = await computePointsForSpend(customerId, order.totalAmountMinor);
  if (points > 0) {
    await awardPoints(customerId, points, {
      description: `Earned from order ${order.orderNumber}`,
      referenceType: "ticketOrder",
      referenceId: order._id.toString(),
      initiatedBy,
    });
  }
  return points;
}

/** One-click purchase: wallet balance covers the full (post-points-discount) amount. */
export async function payTicketWithWallet(eventId, payload, userId, { pointsToRedeem = 0, initiatedBy = "customer" } = {}) {
  const { order, payment } = await quoteOrder(eventId, payload, userId);

  const { discountMinor, amountDueMinor } = await applyPointsDiscount(userId, pointsToRedeem, order.totalAmountMinor);

  try {
    if (amountDueMinor > 0) {
      await debitWallet(userId, amountDueMinor, {
        type: "purchase",
        description: `Tickets — ${order.orderNumber}`,
        referenceType: "ticketOrder",
        referenceId: order._id.toString(),
        initiatedBy,
      });
    }
  } catch (e) {
    // Compensate: give the redeemed points back since the purchase didn't go through.
    if (pointsToRedeem > 0) {
      await awardPoints(userId, pointsToRedeem, {
        description: "Points refunded — wallet payment failed",
        referenceType: "ticketOrder",
        referenceId: order._id.toString(),
        initiatedBy: "customer",
      });
    }
    order.orderStatus = "CANCELLED";
    order.paymentStatus = "failed";
    await order.save();
    throw e;
  }

  await cancelUnusedIntent(payment?.paymentIntentId);

  if (discountMinor > 0) {
    order.appliedDiscounts.push({ type: "points_redemption", label: "Reward points", amountMinor: discountMinor });
  }
  order.paymentMethod = "wallet";
  order.paymentIntentId = "";

  try {
    await order.save();
    const fulfilled = await fulfillOrder(order._id, null, { isFreeOrder: true });
    const points = await awardPurchasePoints(userId, order, initiatedBy);
    return { order: fulfilled.order, tickets: fulfilled.tickets, pointsEarned: points, pointsRedeemedDiscountMinor: discountMinor };
  } catch (e) {
    console.error("[wallet-checkout] booking failed after wallet debit:", e.message);
    // The wallet (and any redeemed points) were already spent above — refund
    // both since no ticket was actually issued.
    if (amountDueMinor > 0) {
      await creditWallet(userId, amountDueMinor, {
        type: "refund",
        description: `Refund — booking could not be completed for order ${order.orderNumber}`,
        referenceType: "ticketOrder",
        referenceId: order._id.toString(),
        initiatedBy,
      }).catch((refundErr) => {
        console.error("[wallet-checkout] CRITICAL: refund after failed booking also failed:", refundErr.message);
      });
    }
    if (pointsToRedeem > 0) {
      await awardPoints(userId, pointsToRedeem, {
        description: "Points refunded — booking could not be completed",
        referenceType: "ticketOrder",
        referenceId: order._id.toString(),
        initiatedBy: "customer",
      }).catch(() => {});
    }
    await TicketOrder.findByIdAndUpdate(order._id, {
      $set: { paymentStatus: "failed", orderStatus: "CANCELLED" },
    }).catch(() => {});
    throw err("We couldn't complete this booking, so your V.Wallet balance (and any points used) have been refunded. Please try again.", 500);
  }
}

/**
 * Split payment: part wallet (debited only after the card portion succeeds,
 * via the Stripe webhook calling `applyDeferredWalletPortion`), part card.
 */
export async function payTicketSplit(eventId, payload, userId, { walletPortionMinor, pointsToRedeem = 0 }) {
  const { order, payment } = await quoteOrder(eventId, payload, userId);

  const { discountMinor, amountDueMinor } = await applyPointsDiscount(userId, pointsToRedeem, order.totalAmountMinor);
  const cappedWalletPortion = await capWalletPortion(userId, walletPortionMinor, amountDueMinor);
  const cardPortionMinor = amountDueMinor - cappedWalletPortion;

  if (cardPortionMinor <= 0) {
    throw err("This order can be paid entirely from your wallet — use the one-click wallet payment instead.");
  }

  await cancelUnusedIntent(payment?.paymentIntentId);

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: cardPortionMinor,
    currency: env.stripe.currency,
    automatic_payment_methods: { enabled: true, allow_redirects: "always" },
    description: `Tickets — ${order.orderNumber} (card portion)`,
    metadata: {
      payment_kind: "event_ticket",
      order_id: order._id.toString(),
      wallet_portion_minor: String(cappedWalletPortion),
      points_redeemed: String(pointsToRedeem || 0),
    },
  });

  order.paymentMethod = "wallet_split";
  order.paymentIntentId = intent.id;
  if (discountMinor > 0) {
    order.appliedDiscounts.push({ type: "points_redemption", label: "Reward points", amountMinor: discountMinor });
    order.pointsRedeemed = pointsToRedeem;
  }
  await order.save();

  return { order, clientSecret: intent.client_secret, paymentIntentId: intent.id, walletPortionMinor: cappedWalletPortion, cardPortionMinor };
}

/**
 * Called when the customer backs out of a split payment's card step (or, defensively,
 * whenever we otherwise learn the card portion is never going to complete). Points were
 * already redeemed eagerly in payTicketSplit above — the wallet balance portion was NOT
 * touched yet (it's deferred until the card side succeeds), so only points need refunding
 * here. Guarded by paymentStatus so a retry (e.g. double-click) can't refund twice.
 */
export async function cancelTicketSplitPayment(orderId, userId) {
  const order = await TicketOrder.findById(orderId);
  if (!order) throw err("Order not found.", 404);
  if (String(order.userId) !== String(userId)) throw err("Not authorized to cancel this order.", 403);
  if (order.paymentMethod !== "wallet_split") throw err("This order was not a V.Wallet split payment.", 400);
  if (order.paymentStatus !== "pending") {
    // Already resolved (paid via webhook, or already cancelled) — nothing to do.
    return { success: true, alreadyResolved: true };
  }

  await cancelUnusedIntent(order.paymentIntentId);

  if (order.pointsRedeemed > 0) {
    await awardPoints(userId, order.pointsRedeemed, {
      description: "Points refunded — payment cancelled",
      referenceType: "ticketOrder",
      referenceId: order._id.toString(),
      initiatedBy: "customer",
    });
  }

  order.paymentStatus = "failed";
  order.orderStatus = "CANCELLED";
  await order.save();

  return { success: true };
}

/** Called from the Stripe webhook once the card portion of a split payment succeeds. */
export async function applyDeferredWalletPortion(orderId, meta) {
  const walletPortionMinor = Number(meta.wallet_portion_minor || 0);
  if (!walletPortionMinor) return { success: true };

  const order = await TicketOrder.findById(orderId);
  if (!order || !order.userId) return { success: false, error: "Order or customer not found." };

  const result = await deferWalletDebit(order.userId, walletPortionMinor, {
    type: "purchase",
    description: `Tickets — ${order.orderNumber} (wallet portion)`,
    referenceType: "ticketOrder",
    referenceId: order._id.toString(),
    initiatedBy: "customer",
  });
  if (!result.success) return result;

  await awardPurchasePoints(order.userId, order, "customer");
  return { success: true };
}
