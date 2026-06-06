import mongoose from "mongoose";
import PaymentTransaction from "../models/PaymentTransaction.js";
import User from "../models/User.js";
import { buildReceiptNumber } from "../utils/receiptNumber.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Persists a succeeded Stripe PaymentIntent once (idempotent by paymentIntentId).
 * @param {import('stripe').Stripe.PaymentIntent} intent
 */
export async function recordSucceededPaymentIntent(intent, overrides = {}) {
  if (!intent?.id || intent.status !== "succeeded") return;

  const meta = intent.metadata || {};
  const donorEmail = normalizeEmail(meta.sponsor_email);
  if (!donorEmail) return;

  const kind =
    overrides.kind ||
    (meta.payment_kind === "donation"
      ? "donation"
      : meta.payment_kind === "membership"
        ? "membership"
        : "sponsorship");
  let userId = null;
  if (meta.user_id && mongoose.isValidObjectId(meta.user_id)) {
    userId = new mongoose.Types.ObjectId(meta.user_id);
  } else {
    const match = await User.findOne({ email: donorEmail }).select("_id").lean();
    userId = match?._id || null;
  }

  const amountMinor = intent.amount_received || intent.amount;
  const currency = String(intent.currency || "eur").toLowerCase();
  const tierId = String(meta.tier_id || "");
  const tierName = String(meta.tier_name || "");
  const paidAt = intent.created ? new Date(intent.created * 1000) : new Date();
  const receiptNumber =
    overrides.receiptNumber || buildReceiptNumber(intent.id, intent.created);

  await PaymentTransaction.updateOne(
    { paymentIntentId: intent.id },
    {
      $setOnInsert: {
        userId,
        donorEmail,
        kind,
        amountMinor,
        currency,
        tierId,
        tierName,
        receiptNumber,
        paidAt
      }
    },
    { upsert: true }
  );
}
