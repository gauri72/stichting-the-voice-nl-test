import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import WalletSettings from "../models/WalletSettings.js";
import WalletGlobalSettings from "../models/WalletGlobalSettings.js";

export async function getOrCreateWallet(customerId) {
  return Wallet.findOneAndUpdate(
    { customerId },
    { $setOnInsert: { customerId, balanceMinor: 0, rewardPoints: 0, totalEarnedMinor: 0, totalSpentMinor: 0 } },
    { upsert: true, new: true }
  );
}

export async function getOrCreateWalletSettings(customerId) {
  return WalletSettings.findOneAndUpdate(
    { customerId },
    { $setOnInsert: { customerId } },
    { upsert: true, new: true }
  );
}

export async function getGlobalSettings() {
  return WalletGlobalSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true }
  );
}

export async function getWalletSummary(customerId) {
  // Reconcile any redirect-based top-ups (iDEAL, Bancontact) the webhook
  // hasn't caught up with yet, before reading the balance below — this is
  // what makes the wallet page show the right balance immediately after a
  // bank-redirect return, even if the webhook is slow. Dynamic import avoids
  // a circular dependency (walletTopUpService imports getOrCreateWallet
  // etc. from this same file).
  try {
    const { reconcilePendingTopUps } = await import("./walletTopUpService.js");
    await reconcilePendingTopUps(customerId);
  } catch (err) {
    console.warn("[wallet] reconcilePendingTopUps failed:", err.message);
  }

  const [wallet, settings, global] = await Promise.all([
    getOrCreateWallet(customerId),
    getOrCreateWalletSettings(customerId),
    getGlobalSettings(),
  ]);
  return {
    enabled: global.enabled,
    balanceMinor: wallet.balanceMinor,
    rewardPoints: wallet.rewardPoints,
    totalEarnedMinor: wallet.totalEarnedMinor,
    totalSpentMinor: wallet.totalSpentMinor,
    lowBalance: wallet.balanceMinor < settings.lowBalanceThresholdMinor,
    settings: {
      aiBookingEnabled: settings.aiBookingEnabled,
      maxAISpendPerTransactionMinor: settings.maxAISpendPerTransactionMinor,
      dailyAISpendLimitMinor: settings.dailyAISpendLimitMinor,
      lowBalanceThresholdMinor: settings.lowBalanceThresholdMinor,
      confirmationStepEnabled: settings.confirmationStepEnabled,
      defaultTopUpAmountMinor: settings.defaultTopUpAmountMinor,
    },
    pointsProgram: {
      pointsPerEuroSpent: global.pointsPerEuroSpent,
      minRedemptionPoints: global.minRedemptionPoints,
      pointsNeededPerEuroDiscount: global.pointsNeededPerEuroDiscount,
      pointsExpiryDays: global.pointsExpiryDays,
    },
  };
}

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/**
 * Credits the wallet balance and writes the matching ledger row, atomically.
 * Throws if the credit would push the balance past the admin-configured
 * per-customer cap (unless `allowOverCap` is set, used for admin overrides).
 */
export async function creditWallet(customerId, amountMinor, opts = {}) {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw err("Credit amount must be a positive integer (minor units).");

  const global = await getGlobalSettings();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOneAndUpdate({ customerId }, { $setOnInsert: { customerId } }, { upsert: true, new: true, session });
    const projectedBalance = wallet.balanceMinor + amountMinor;
    if (!opts.allowOverCap && projectedBalance > global.maxWalletBalanceMinor) {
      throw err(`This top-up would exceed the maximum wallet balance of €${(global.maxWalletBalanceMinor / 100).toFixed(2)}.`);
    }

    const updated = await Wallet.findOneAndUpdate(
      { customerId },
      { $inc: { balanceMinor: amountMinor, totalEarnedMinor: amountMinor } },
      { new: true, session }
    );

    const [transaction] = await WalletTransaction.create(
      [
        {
          customerId,
          type: opts.type || "topup",
          amountMinor,
          description: opts.description || "",
          referenceType: opts.referenceType || "",
          referenceId: opts.referenceId || "",
          initiatedBy: opts.initiatedBy || "customer",
          paymentIntentId: opts.paymentIntentId || "",
          status: "completed",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { wallet: updated, transaction };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

/**
 * Debits the wallet balance and writes the matching ledger row, atomically.
 * The balance check and the decrement happen as a single conditional
 * `findOneAndUpdate` inside the transaction so two concurrent debits can
 * never both succeed against an insufficient balance (no read-then-write gap).
 */
export async function debitWallet(customerId, amountMinor, opts = {}) {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw err("Debit amount must be a positive integer (minor units).");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Wallet.findOneAndUpdate(
      { customerId, balanceMinor: { $gte: amountMinor } },
      { $inc: { balanceMinor: -amountMinor, totalSpentMinor: amountMinor } },
      { new: true, session }
    );
    if (!updated) throw err("Insufficient wallet balance.", 402);

    const [transaction] = await WalletTransaction.create(
      [
        {
          customerId,
          type: opts.type || "purchase",
          amountMinor: -amountMinor,
          description: opts.description || "",
          referenceType: opts.referenceType || "",
          referenceId: opts.referenceId || "",
          initiatedBy: opts.initiatedBy || "customer",
          status: "completed",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { wallet: updated, transaction };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function computePointsForSpend(customerId, amountMinor) {
  const global = await getGlobalSettings();
  const euros = amountMinor / 100;
  let points = Math.floor(euros * global.pointsPerEuroSpent);

  const promo = global.bonusMultipliers?.promo;
  if (promo?.active && (!promo.endsAt || new Date(promo.endsAt) > new Date())) {
    points = Math.floor(points * (promo.multiplier || 1));
  }

  const priorPurchases = await WalletTransaction.countDocuments({ customerId, type: "purchase", initiatedBy: { $ne: "admin" } });
  if (priorPurchases === 0) {
    points += global.bonusMultipliers?.firstPurchaseBonusPoints || 0;
  }

  return points;
}

export async function awardPoints(customerId, points, opts = {}) {
  if (!Number.isInteger(points) || points <= 0) return null;
  const global = await getGlobalSettings();
  const expiresAt = new Date(Date.now() + global.pointsExpiryDays * 24 * 60 * 60 * 1000);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { customerId },
      { $inc: { rewardPoints: points } },
      { new: true, upsert: true, session }
    );
    const [transaction] = await WalletTransaction.create(
      [
        {
          customerId,
          type: "pointsEarned",
          points,
          description: opts.description || "Reward points earned",
          referenceType: opts.referenceType || "",
          referenceId: opts.referenceId || "",
          initiatedBy: opts.initiatedBy || "customer",
          expiresAt,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    return { wallet, transaction };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

/**
 * Ticket Tailor orders have no platform Event ObjectId to key off of — the
 * event's title is the only stable identifier available across multiple
 * orders for the same event (mirrors the same grouping key already used to
 * de-duplicate Ticket Tailor rows in "My Event History"). Prefixed so it can
 * never collide with a real Mongo ObjectId passed to the same function.
 */
export function ticketTailorEventReferenceId(eventTitle) {
  const slug = String(eventTitle || "event")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `tt:${slug}`;
}

/**
 * Awards the flat per-event bonus the first time a customer's order for a
 * given event settles, and is a no-op on every subsequent ticket/order for
 * that same event — points are for *attending an event*, not per ticket or
 * per order. Idempotency is enforced by checking for an existing
 * pointsEarned transaction with this exact (customerId, eventId) reference
 * rather than relying on the caller to only call this once. `eventId` can be
 * a platform Event ObjectId (string) or a ticketTailorEventReferenceId().
 */
export async function awardEventAttendancePoints(customerId, eventId, eventTitle) {
  if (!customerId || !eventId) return null;
  const global = await getGlobalSettings();
  const points = global.pointsPerEventAttended;
  if (!Number.isInteger(points) || points <= 0) return null;

  const existing = await WalletTransaction.findOne({
    customerId,
    referenceType: "eventAttendance",
    referenceId: String(eventId),
  }).lean();
  if (existing) return null;

  return awardPoints(customerId, points, {
    description: `Attended ${eventTitle || "an event"}`,
    referenceType: "eventAttendance",
    referenceId: String(eventId),
    initiatedBy: "system",
  });
}

/** Read-only preview of what redeeming N points would discount, for checkout UI — does not mutate anything. The actual redemption happens via redeemPoints() at payment time. */
export async function previewPointsRedemption(customerId, points) {
  if (!Number.isInteger(points) || points <= 0) throw err("Points to redeem must be a positive integer.");
  const [wallet, global] = await Promise.all([getOrCreateWallet(customerId), getGlobalSettings()]);
  if (points < global.minRedemptionPoints) throw err(`You need at least ${global.minRedemptionPoints} points to redeem.`);
  if (points > wallet.rewardPoints) throw err("You don't have enough points for this redemption.");
  const discountMinor = Math.round((points / global.pointsNeededPerEuroDiscount) * 100);
  return { points, discountMinor, remainingPoints: wallet.rewardPoints - points };
}

/** Returns the discount amount (minor units) for a given points redemption, after validating it against the program rules and the customer's balance. */
export async function redeemPoints(customerId, points) {
  if (!Number.isInteger(points) || points <= 0) throw err("Points to redeem must be a positive integer.");
  const global = await getGlobalSettings();
  if (points < global.minRedemptionPoints) {
    throw err(`You need at least ${global.minRedemptionPoints} points to redeem.`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Wallet.findOneAndUpdate(
      { customerId, rewardPoints: { $gte: points } },
      { $inc: { rewardPoints: -points } },
      { new: true, session }
    );
    if (!updated) throw err("You don't have enough points for this redemption.");

    const discountMinor = Math.round((points / global.pointsNeededPerEuroDiscount) * 100);

    const [transaction] = await WalletTransaction.create(
      [
        {
          customerId,
          type: "pointsRedeemed",
          points: -points,
          amountMinor: 0, // the resulting discount is applied to the order, not credited to the wallet balance
          description: `Redeemed ${points} points for €${(discountMinor / 100).toFixed(2)} off`,
          initiatedBy: "customer",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { wallet: updated, transaction, discountMinor };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function listTransactions(customerId, { limit = 50, before } = {}) {
  // "pending" rows are an internal tracking mechanism for in-flight
  // redirect-based top-ups (see walletTopUpService.js's reconcilePendingTopUps)
  // — they either resolve to a real "completed" row or get reconciled away,
  // so showing a transient "€0.00 (pending)" entry in the customer's history
  // would just be confusing.
  const query = { customerId, status: { $ne: "pending" } };
  if (before) query.createdAt = { $lt: new Date(before) };
  return WalletTransaction.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}
