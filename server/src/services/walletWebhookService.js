import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { creditWallet } from "./walletService.js";
import { sendTopUpConfirmationEmail } from "./walletMailer.js";

/**
 * Called from the Stripe webhook once a wallet top-up PaymentIntent succeeds
 * (and also from reconcilePendingTopUps() as a fallback for redirect-based
 * methods, in case the webhook is slow). Idempotent against being completed
 * twice — but a "pending" row (created at intent-creation time, before any
 * payment confirmation) does NOT count as already-processed, only a
 * "completed" one does; a stale pending row for this intent is cleared
 * before crediting so it doesn't linger forever.
 */
export async function confirmTopUpFromWebhook(intent) {
  const existing = await WalletTransaction.findOne({ paymentIntentId: intent.id, status: "completed" }).lean();
  if (existing) return existing;

  await WalletTransaction.deleteMany({ paymentIntentId: intent.id, status: "pending" });

  const meta = intent.metadata || {};
  const customerId = meta.user_id;
  const amountMinor = intent.amount_received || intent.amount;
  if (!customerId || !amountMinor) return null;

  const { wallet } = await creditWallet(customerId, amountMinor, {
    type: "topup",
    description: "V.Wallet top-up via Stripe",
    referenceType: "topup",
    referenceId: intent.id,
    initiatedBy: "customer",
    paymentIntentId: intent.id,
  });

  const user = await User.findById(customerId).lean();
  if (user) {
    await sendTopUpConfirmationEmail({
      to: user.email,
      firstName: user.firstName,
      amountMinor,
      newBalanceMinor: wallet.balanceMinor,
    });
  }

  return wallet;
}
