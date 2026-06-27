import crypto from "crypto";
import env from "../config/env.js";
import { getStripe } from "./stripe.js";
import User from "../models/User.js";
import WalletSettings from "../models/WalletSettings.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { getOrCreateWallet, getGlobalSettings } from "./walletService.js";
import { sendTopUpOtpEmail } from "./walletMailer.js";
import { confirmTopUpFromWebhook } from "./walletWebhookService.js";

const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
}

function otpMatches(settings, otp) {
  if (!settings?.topUpOtpHash || !settings?.topUpOtpExpires) return false;
  if (new Date(settings.topUpOtpExpires) < new Date()) return false;
  const submitted = hashOtp(otp);
  const stored = Buffer.from(settings.topUpOtpHash, "utf8");
  const candidate = Buffer.from(submitted, "utf8");
  if (stored.length !== candidate.length) return false;
  return crypto.timingSafeEqual(stored, candidate);
}

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/**
 * Creates a Stripe PaymentIntent for a wallet top-up. If the amount is at or
 * above the admin-configured 2FA threshold and no valid OTP was supplied,
 * sends an OTP email and returns `{ otpRequired: true }` instead of a
 * PaymentIntent — the client re-submits with the OTP to actually proceed.
 */
export async function createTopUpPaymentIntent(customerId, { amountMinor, otp, clientRequestId }) {
  if (!Number.isInteger(amountMinor) || amountMinor < 100) {
    throw err("Top-up amount must be at least €1.");
  }

  const global = await getGlobalSettings();
  if (!global.enabled) throw err("V.Wallet is currently unavailable. Please try again later.");

  const wallet = await getOrCreateWallet(customerId);
  if (wallet.balanceMinor + amountMinor > global.maxWalletBalanceMinor) {
    throw err(`This top-up would exceed the maximum wallet balance of €${(global.maxWalletBalanceMinor / 100).toFixed(2)}.`);
  }

  if (amountMinor >= global.twoFactorTopUpThresholdMinor) {
    const settings = await WalletSettings.findOne({ customerId }).select("+topUpOtpHash +topUpOtpExpires");
    if (!otp) {
      await requestTopUpOtp(customerId, amountMinor);
      return { otpRequired: true };
    }
    if (!otpMatches(settings, otp)) {
      throw err("That confirmation code is incorrect or has expired.");
    }
    settings.topUpOtpHash = null;
    settings.topUpOtpExpires = null;
    await settings.save();
  }

  const stripe = getStripe();
  const idempotencyKey = `wallet_topup_${customerId}_${clientRequestId || crypto.randomUUID()}`;

  const intent = await stripe.paymentIntents.create(
    {
      amount: amountMinor,
      currency: env.stripe.currency,
      automatic_payment_methods: { enabled: true, allow_redirects: "always" },
      description: "V.Wallet top-up",
      metadata: {
        payment_kind: "wallet_topup",
        user_id: customerId.toString(),
        wallet_amount_minor: String(amountMinor),
      },
    },
    { idempotencyKey }
  );

  // A pending ledger row tracks this intent locally from the moment it's
  // created — not just when the webhook eventually fires. Several of this
  // payment method set redirect to the customer's bank (iDEAL, Bancontact)
  // and are NOT optional the way `redirect: "if_required"` makes cards
  // skip-able, so the webhook is sometimes the only signal we get; this
  // pending row is what reconcilePendingTopUps() below checks against if
  // that webhook is ever slow or missed.
  await WalletTransaction.create({
    customerId,
    type: "topup",
    amountMinor: 0,
    description: "V.Wallet top-up via Stripe (pending)",
    referenceType: "topup",
    referenceId: intent.id,
    initiatedBy: "customer",
    paymentIntentId: intent.id,
    status: "pending",
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amount: amountMinor, currency: env.stripe.currency };
}

/**
 * Safety net for the redirect-based payment methods (iDEAL, Bancontact,
 * etc.): checks this customer's own pending top-up intents directly against
 * Stripe and completes/fails them if the webhook hasn't caught up yet.
 * Called from getWalletSummary() so it runs every time the wallet page
 * loads — including right after a bank-redirect return.
 */
export async function reconcilePendingTopUps(customerId) {
  const pending = await WalletTransaction.find({ customerId, type: "topup", status: "pending" })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  if (!pending.length) return;

  const stripe = getStripe();
  for (const row of pending) {
    try {
      const intent = await stripe.paymentIntents.retrieve(row.paymentIntentId);
      if (intent.status === "succeeded") {
        await WalletTransaction.deleteOne({ _id: row._id });
        await confirmTopUpFromWebhook(intent);
      } else if (intent.status === "canceled") {
        // The only genuinely terminal failure state. "requires_payment_method"
        // is this intent's normal starting state (and what it reverts to
        // after a declined attempt the customer can still retry) — treating
        // that as "failed" would wrongly kill a top-up before the customer
        // has even tried, or mid-retry. Leave it pending and check again
        // next load; a stale abandoned row is harmless either way.
        await WalletTransaction.updateOne({ _id: row._id }, { $set: { status: "failed" } });
      }
    } catch (err) {
      console.warn(`[wallet] reconcilePendingTopUps: could not check ${row.paymentIntentId}:`, err.message);
    }
  }
}

async function requestTopUpOtp(customerId, amountMinor) {
  const [user, settings] = await Promise.all([
    User.findById(customerId).lean(),
    WalletSettings.findOneAndUpdate({ customerId }, { $setOnInsert: { customerId } }, { upsert: true, new: true }),
  ]);
  if (!user) throw err("Customer not found.", 404);

  const otp = generateOtp();
  settings.topUpOtpHash = hashOtp(otp);
  settings.topUpOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  await settings.save();

  const mailResult = await sendTopUpOtpEmail({ to: user.email, firstName: user.firstName, otp, amountMinor });
  return { devOtp: mailResult.devOtp };
}
