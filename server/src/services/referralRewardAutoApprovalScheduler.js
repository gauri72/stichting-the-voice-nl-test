import ReferralReward from "../models/ReferralReward.js";
import TicketOrder from "../models/TicketOrder.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { creditWallet } from "./walletService.js";
import { getReferralProgramSettings } from "./referralProgramSettingsService.js";
import { CURRENCY_REWARD_TYPES } from "../config/discountConfig.js";
import { sendReferralRewardPaidEmail } from "./discountMailer.js";

const TICK_MS = 6 * 60 * 60 * 1000; // 6h — frequent enough relative to a multi-day hold, not wasteful

let timer = null;
let running = false;

async function getPaidThisMonthMinor(referrerUserId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [result] = await ReferralReward.aggregate([
    {
      $match: {
        referrerUserId,
        rewardStatus: "paid",
        paidAt: { $gte: monthStart },
      },
    },
    { $group: { _id: null, total: { $sum: "$rewardValue" } } },
  ]);
  return result?.total || 0;
}

/** Resolves one due reward — cancel, auto-pay, or fall back to "needs manual payout". */
async function processReward(reward, settings) {
  // ReferralReward.orderId stores TicketOrder.orderNumber (recordOrderDiscountUsage's
  // convention), not the Mongo _id — this is the only order-creation path that currently
  // records referral usage.
  const order = reward.orderId
    ? await TicketOrder.findOne({ orderNumber: reward.orderId }).select("paymentStatus").lean()
    : null;

  if (order && (order.paymentStatus === "refunded" || order.paymentStatus === "failed")) {
    await ReferralReward.updateOne({ _id: reward._id }, { $set: { rewardStatus: "cancelled" } });
    return "cancelled";
  }

  const isCurrencyReward = CURRENCY_REWARD_TYPES.includes(reward.rewardType);
  const hasWalletAccount = Boolean(reward.referrerUserId);

  if (!isCurrencyReward || !hasWalletAccount || reward.rewardValue <= 0) {
    await ReferralReward.updateOne(
      { _id: reward._id },
      { $set: { rewardStatus: "approved", approvedAt: new Date(), awaitingManualPayout: true } }
    );
    return "needs-manual-payout";
  }

  const capMinor = settings.monthlyCapMinor;
  if (capMinor > 0) {
    const paidThisMonth = await getPaidThisMonthMinor(reward.referrerUserId);
    if (paidThisMonth + reward.rewardValue > capMinor) {
      await ReferralReward.updateOne(
        { _id: reward._id },
        { $set: { rewardStatus: "approved", approvedAt: new Date(), awaitingManualPayout: true } }
      );
      return "capped";
    }
  }

  // Idempotent check-then-write: if a WalletTransaction for this reward already exists
  // (a prior tick credited the wallet but crashed before saving rewardStatus), skip
  // crediting again and just advance the status.
  const existingTransaction = await WalletTransaction.findOne({
    referenceType: "referralReward",
    referenceId: String(reward._id),
  }).lean();

  if (!existingTransaction) {
    try {
      await creditWallet(reward.referrerUserId, reward.rewardValue, {
        type: "referralReward",
        description: `Referral reward — ${reward.rewardId || reward._id}`,
        referenceType: "referralReward",
        referenceId: String(reward._id),
        initiatedBy: "system",
      });
    } catch (err) {
      // e.g. would exceed the wallet's own maxWalletBalanceMinor cap — leave it pending
      // for a future tick rather than losing the reward or crashing the whole batch.
      console.warn(`[referrals] Could not auto-credit reward ${reward._id}: ${err.message}`);
      return "credit-failed";
    }
  }

  await ReferralReward.updateOne(
    { _id: reward._id },
    { $set: { rewardStatus: "paid", approvedAt: reward.approvedAt || new Date(), paidAt: new Date() } }
  );

  if (reward.referrerEmail) {
    sendReferralRewardPaidEmail({
      email: reward.referrerEmail,
      rewardValue: `€${(reward.rewardValue / 100).toFixed(2)}`,
      creditedToWallet: true,
    }).catch((err) => console.error("[referrals] referral reward paid email failed:", err.message));
  }

  return "paid";
}

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    const settings = await getReferralProgramSettings();
    const due = await ReferralReward.find({
      rewardStatus: "pending",
      holdUntil: { $lte: new Date() },
    }).lean();

    const tally = {};
    for (const reward of due) {
      const outcome = await processReward(reward, settings);
      tally[outcome] = (tally[outcome] || 0) + 1;
    }
    console.log(`[referrals] auto-approval (${reason}): ${due.length} due, ${JSON.stringify(tally)}.`);
  } catch (err) {
    console.warn(`[referrals] auto-approval (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startReferralRewardAutoApprovalScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[referrals] auto-approval scheduler started (every 6h).");
}
