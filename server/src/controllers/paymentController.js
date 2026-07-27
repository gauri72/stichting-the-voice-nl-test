import crypto from "crypto";
import env from "../config/env.js";
import { isValidEmail } from "../utils/validation.js";
import { getDonationTier } from "../config/donationTiers.js";
import { getPlan } from "../config/membershipPlans.js";
import { getTier } from "../config/sponsorshipTiers.js";
import DiscountCode from "../models/DiscountCode.js";
import User from "../models/User.js";
import {
  getActiveWebhookSecret,
  getStripe,
  isStripeConfigured,
} from "../services/stripe.js";
import { getActivePaymentProvider } from "../services/stripeSettingsService.js";
import { sendDonationEmails, sendSponsorshipEmails } from "../services/mailer.js";
import { sendMembershipEmails } from "../services/membershipMailer.js";
import { provisionMembershipFromPayment } from "../services/membershipProvisioningService.js";
import { recordSucceededPaymentIntent } from "../services/paymentRecordService.js";
import { linkPaymentIntentToRecords } from "../services/sponsorshipDonationRecordService.js";
import { buildReceiptNumber } from "../utils/receiptNumber.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { creditWallet, awardPoints } from "../services/walletService.js";
import { applyPointsDiscount, capWalletPortion, deferWalletDebit } from "../services/walletSplitPaymentService.js";

// In-memory guard so we don't email twice if both webhook and client confirmation fire.
const emailedIntents = new Set();

function clientSecretMatches(intent, submitted) {
  const expected = String(intent?.client_secret || "");
  const candidate = String(submitted || "");
  if (!expected || !candidate) return false;
  const expectedBuf = Buffer.from(expected, "utf8");
  const candidateBuf = Buffer.from(candidate, "utf8");
  if (expectedBuf.length !== candidateBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, candidateBuf);
}

function describeStripePaymentMethod(intent) {
  const pm = intent?.payment_method;
  if (pm && typeof pm === "object") {
    if (pm.type === "card" && pm.card?.brand) {
      const brand = pm.card.brand
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `${brand} card via Stripe`;
    }
    if (pm.type) {
      const label = pm.type.replace(/_/g, " ");
      return `${label.charAt(0).toUpperCase() + label.slice(1)} via Stripe`;
    }
  }
  const charge = intent?.latest_charge;
  if (charge && typeof charge === "object") {
    const details = charge.payment_method_details;
    if (details?.card?.brand) {
      const brand = details.card.brand
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `${brand} card via Stripe`;
    }
  }
  return "Card via Stripe";
}

// isWalletOnlyIntent: the synthetic pseudo-intent built for a 100%
// wallet/points-covered payment (see payWithWalletOnly below) — it has no
// real payment_method/latest_charge to sniff a card brand from, and would
// otherwise wrongly fall through to the generic "Card via Stripe" default.
function describePaymentMethod(intent, { walletPortionMinor = 0, isWalletOnlyIntent = false } = {}) {
  if (isWalletOnlyIntent) return "V.Wallet";
  const cardOrRedirectLabel = describeStripePaymentMethod(intent);
  if (walletPortionMinor > 0) {
    return `Partly V.Wallet (€${(walletPortionMinor / 100).toFixed(2)}), partly ${cardOrRedirectLabel}`;
  }
  return cardOrRedirectLabel;
}

function sanitizeSponsor(input = {}) {
  const firstName = String(input.firstName || "").trim().slice(0, 80);
  const lastName = String(input.lastName || "").trim().slice(0, 80);
  const name =
    String(input.name || `${firstName} ${lastName}`).trim().slice(0, 160) || "Sponsor";
  const email = String(input.email || "").trim().slice(0, 160);
  const phone = String(input.phone || "").trim().slice(0, 40);
  const organization = String(input.organization || "").trim().slice(0, 160);
  const country = String(input.country || "").trim().slice(0, 80);
  const message = String(input.message || "").trim().slice(0, 1000);

  return { name, firstName, lastName, email, phone, organization, country, message };
}


async function emailSponsorOnce(payload) {
  const { paymentIntentId } = payload;
  if (!paymentIntentId) return;
  if (emailedIntents.has(paymentIntentId)) return;
  emailedIntents.add(paymentIntentId);

  try {
    await sendSponsorshipEmails(payload);
  } catch (error) {
    emailedIntents.delete(paymentIntentId);
    console.error("[payments] Failed to send sponsorship email:", error.message);
  }
}

async function emailDonationOnce(payload) {
  const { paymentIntentId } = payload;
  if (!paymentIntentId) return;
  if (emailedIntents.has(paymentIntentId)) return;
  emailedIntents.add(paymentIntentId);

  try {
    await sendDonationEmails(payload);
  } catch (error) {
    emailedIntents.delete(paymentIntentId);
    console.error("[payments] Failed to send donation email:", error.message);
  }
}

async function emailMembershipOnce(payload) {
  const { paymentIntentId } = payload;
  if (!paymentIntentId) return;
  if (emailedIntents.has(paymentIntentId)) return;
  emailedIntents.add(paymentIntentId);

  try {
    await sendMembershipEmails(payload);
  } catch (error) {
    emailedIntents.delete(paymentIntentId);
    console.error("[payments] Failed to send membership email:", error.message);
  }
}

async function handleSucceededPayment(intent) {
  const meta = intent.metadata || {};

  if (meta.payment_kind === "wallet_topup") {
    const { confirmTopUpFromWebhook } = await import("../services/walletWebhookService.js");
    await confirmTopUpFromWebhook(intent);
    return;
  }

  if (meta.payment_kind === "event_ticket" || meta.payment_kind === "ticket_and_membership") {
    const orderId = meta.order_id;
    if (!orderId) return;

    // Split V.Wallet + card checkout: fulfillOrder() itself applies the
    // deferred wallet debit (via metadata.wallet_portion_minor) once it has
    // re-confirmed the card portion succeeded, so the wallet is never charged
    // for an order that fails on the card side. That logic is shared with the
    // client's post-redirect confirm-intent path — see postPaymentFulfillmentService.js.
    const { fulfillOrder } = await import("../services/postPaymentFulfillmentService.js");
    await fulfillOrder(orderId, intent.id);
    return;
  }

  // Split V.Wallet + card/points checkout for donation/sponsorship/membership
  // — mirrors the ticket flow. A real Stripe intent here only covers the card
  // remainder, so the true total paid needs the wallet portion added back in
  // before anything derives "amount paid" from it. The wallet-only synthetic
  // intent built by payWithWalletOnly() already carries the full amount (its
  // id is prefixed "wallet_"), so it's excluded from that correction.
  const walletPortionMinor = Number(meta.wallet_portion_minor || 0);
  const isWalletOnlyIntent = String(intent.id || "").startsWith("wallet_");
  const needsAmountCorrection = walletPortionMinor > 0 && !isWalletOnlyIntent;
  const effectiveIntent = needsAmountCorrection
    ? {
        ...intent,
        amount: (intent.amount || 0) + walletPortionMinor,
        amount_received: (intent.amount_received || intent.amount || 0) + walletPortionMinor,
      }
    : intent;
  const paymentMethod = describePaymentMethod(intent, { walletPortionMinor, isWalletOnlyIntent });

  // The wallet portion is only debited once the card side has actually
  // succeeded (this call firing) — never for a failed/abandoned card charge.
  // Both the Stripe webhook and the client's own /api/payments/confirm call
  // can reach this function for the same intent; PaymentTransaction's unique
  // paymentIntentId makes an "already recorded?" check a practical (if not
  // perfectly atomic) guard against double-debiting — the same, pre-existing
  // level of dedup this function already relies on for the sponsorship/
  // donation records below.
  if (needsAmountCorrection && meta.user_id) {
    const alreadyRecorded = await PaymentTransaction.exists({ paymentIntentId: intent.id });
    if (!alreadyRecorded) {
      const debited = await deferWalletDebit(meta.user_id, walletPortionMinor, {
        type: "purchase",
        description: `${meta.tier_name || meta.payment_kind} (wallet portion)`,
        referenceType: meta.payment_kind,
        referenceId: intent.id,
        initiatedBy: "customer",
      });
      if (!debited.success) {
        console.error("[payments] Deferred wallet portion failed for intent", intent.id, debited.error);
        return;
      }
    }
  }

  if (meta.payment_kind === "membership") {
    try {
      const result = await provisionMembershipFromPayment({
        ...effectiveIntent,
        metadata: { ...meta, payment_method_label: paymentMethod }
      });
      try {
        await recordSucceededPaymentIntent(effectiveIntent, {
          kind: "membership",
          receiptNumber: result.member.receiptNumber
        });
      } catch (err) {
        console.error("[payments] recordSucceededPaymentIntent (membership):", err.message);
      }
      await emailMembershipOnce({
        paymentIntentId: intent.id,
        emailPayload: result.emailPayload,
        memberEmail: result.member.email
      });
    } catch (error) {
      console.error("[payments] Membership provisioning failed:", error.message);
    }
    return;
  }

  const sponsor = {
    name: meta.sponsor_name,
    firstName: meta.sponsor_first_name || (meta.sponsor_name || "").split(" ")[0] || "",
    lastName: meta.sponsor_last_name || (meta.sponsor_name || "").split(" ").slice(1).join(" "),
    email: meta.sponsor_email,
    phone: meta.sponsor_phone,
    organization: meta.sponsor_organization,
    country: meta.sponsor_country,
    message: meta.sponsor_message
  };
  const tier = { id: meta.tier_id, name: meta.tier_name };
  const payload = {
    sponsor,
    tier,
    amountMinor: effectiveIntent.amount_received || effectiveIntent.amount,
    currency: intent.currency,
    paymentIntentId: intent.id,
    paymentCreated: intent.created,
    paymentMethod,
    receiptNumber: buildReceiptNumber(intent.id, intent.created)
  };

  try {
    await recordSucceededPaymentIntent(effectiveIntent);
  } catch (err) {
    console.error("[payments] recordSucceededPaymentIntent:", err.message);
  }

  try {
    await linkPaymentIntentToRecords(effectiveIntent, paymentMethod);
  } catch (err) {
    console.error("[payments] linkPaymentIntentToRecords:", err.message);
  }

  if (meta.payment_kind === "donation") {
    await emailDonationOnce(payload);
  } else {
    await emailSponsorOnce(payload);
  }
}

export async function createPaymentIntent(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error:
        "Stripe is not configured on the server. Set STRIPE_SECRET_KEY in server/.env."
    });
  }
  if (!(await getActivePaymentProvider())) {
    return res.status(503).json({
      error: "Online payments are currently disabled. Please try again later."
    });
  }

  try {
    const { kind = "sponsorship", tierId, amount: customAmount, sponsor: rawSponsor, discountCode, walletPortionMinor, pointsToRedeem } =
      req.body || {};
    const isDonation = kind === "donation";
    const isMembership = kind === "membership";
    const tier = isMembership
      ? getPlan(tierId)
      : isDonation
        ? getDonationTier(tierId)
        : getTier(tierId);

    if (!tier) {
      return res.status(400).json({
        error: isMembership
          ? "Unknown membership plan."
          : isDonation
            ? "Unknown donation tier."
            : "Unknown sponsorship tier."
      });
    }

    const sponsor = sanitizeSponsor(rawSponsor);
    if (!sponsor.email || !isValidEmail(sponsor.email)) {
      return res.status(400).json({
        error: isMembership
          ? "A valid member email is required."
          : isDonation
            ? "A valid donor email is required."
            : "A valid sponsor email is required."
      });
    }
    if (!sponsor.name) {
      return res.status(400).json({
        error: isMembership
          ? "Member name is required."
          : isDonation
            ? "Donor name is required."
            : "Sponsor name is required."
      });
    }

    const stripeMinCents = 50;
    let amountMinor = tier.amount ?? tier.feeMinor;
    if (tier.allowCustom) {
      if (!Number.isFinite(Number(customAmount))) {
        return res.status(400).json({ error: "A custom amount is required for this option." });
      }
      const requested = Math.round(Number(customAmount));
      if (requested < stripeMinCents) {
        return res.status(400).json({ error: "Enter a valid amount in EUR." });
      }
      amountMinor = requested;
    }

    let appliedDiscount = null;
    if (isMembership && discountCode) {
      const cleanCode = String(discountCode).trim();
      if (cleanCode) {
        const discount = await DiscountCode.findOne({
          code: cleanCode,
          deletedAt: null,
          status: "active",
        });

        if (!discount) {
          return res.status(400).json({ error: "Invalid discount code." });
        }

        if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
          return res.status(400).json({ error: "This discount code has expired." });
        }

        if (discount.visibleToUsers === false) {
          return res.status(400).json({ error: "This discount code is no longer available." });
        }

        // Check if it is global or assigned to the user
        let isAllowed = discount.isGlobal;
        if (!isAllowed) {
          if (req.user && discount.assignedUsers.some(uid => uid.toString() === req.user.id)) {
            isAllowed = true;
          } else {
            const formEmail = sponsor.email.trim().toLowerCase();
            const assignedUsers = await User.find({ _id: { $in: discount.assignedUsers } });
            const hasMatchingEmail = assignedUsers.some(u => u.email.trim().toLowerCase() === formEmail);
            if (hasMatchingEmail) {
              isAllowed = true;
            }
          }
        }

        if (!isAllowed) {
          return res.status(400).json({ error: "This discount code is not valid for your email / account." });
        }

        appliedDiscount = {
          code: discount.code,
          discountValue: discount.discountValue
        };

        const discountAmount = Math.round((amountMinor * discount.discountValue) / 100);
        amountMinor = Math.max(0, amountMinor - discountAmount);
      }
    }

    const stripe = getStripe();
    const baseMeta = {
      tier_id: tier.id,
      tier_name: tier.name,
      sponsor_name: sponsor.name,
      sponsor_first_name: sponsor.firstName,
      sponsor_last_name: sponsor.lastName,
      sponsor_email: sponsor.email,
      sponsor_phone: sponsor.phone,
      sponsor_organization: sponsor.organization,
      sponsor_country: sponsor.country,
      sponsor_message: sponsor.message ? sponsor.message.slice(0, 480) : ""
    };
    const metadata = {
      ...baseMeta,
      ...(isDonation ? { payment_kind: "donation" } : {}),
      ...(isMembership ? { payment_kind: "membership" } : {}),
      ...(req.user?.id ? { user_id: String(req.user.id) } : {}),
      ...(appliedDiscount ? {
        discount_code: appliedDiscount.code,
        discount_percent: String(appliedDiscount.discountValue)
      } : {})
    };

    const description = isMembership
      ? `Membership - ${tier.name}`
      : isDonation
        ? `Donation - ${tier.name}`
        : `Sponsorship - ${tier.name}`;

    // Optional V.Wallet balance + reward-points composition, authenticated
    // customers only (guest checkout has no wallet or points — matches the
    // ticket flow's auth gate). Same order as tickets: points discount first,
    // then cap the wallet portion against the already-discounted amount, then
    // Stripe covers whatever's left.
    const requestedWalletPortionMinor = Number(walletPortionMinor) || 0;
    const requestedPointsToRedeem = Number(pointsToRedeem) || 0;
    if (req.user?.id && (requestedWalletPortionMinor > 0 || requestedPointsToRedeem > 0)) {
      const { discountMinor: pointsDiscountMinor, amountDueMinor } = await applyPointsDiscount(
        req.user.id,
        requestedPointsToRedeem,
        amountMinor
      );
      const cappedWalletPortion = await capWalletPortion(req.user.id, requestedWalletPortionMinor, amountDueMinor);
      const cardPortionMinor = amountDueMinor - cappedWalletPortion;

      if (cardPortionMinor <= 0) {
        return res.status(201).json(
          await payWithWalletOnly({
            userId: req.user.id,
            walletPortionMinor: cappedWalletPortion,
            pointsToRedeem: requestedPointsToRedeem,
            pointsDiscountMinor,
            metadata,
            tier,
            kind,
            appliedDiscount
          })
        );
      }

      const intent = await stripe.paymentIntents.create({
        amount: cardPortionMinor,
        currency: env.stripe.currency,
        automatic_payment_methods: { enabled: true, allow_redirects: "always" },
        description,
        metadata: {
          ...metadata,
          wallet_portion_minor: String(cappedWalletPortion),
          points_redeemed: String(requestedPointsToRedeem)
        }
      });

      return res.status(201).json({
        mode: "stripe",
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        walletPortionMinor: cappedWalletPortion,
        cardPortionMinor,
        pointsDiscountMinor,
        amount: cardPortionMinor,
        currency: env.stripe.currency,
        tier: { id: tier.id, name: tier.name },
        discountApplied: !!appliedDiscount,
        discountInfo: appliedDiscount
      });
    }

    const intent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: env.stripe.currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always"
      },
      description,
      metadata
    });

    return res.status(201).json({
      mode: "stripe",
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: amountMinor,
      currency: env.stripe.currency,
      tier: { id: tier.id, name: tier.name },
      discountApplied: !!appliedDiscount,
      discountInfo: appliedDiscount
    });
  } catch (error) {
    console.error("[payments] createPaymentIntent error:", error);
    // payWithWalletOnly() throws with a specific .status/.message (e.g. an
    // insufficient-balance race, or a refunded-after-failure notice) that the
    // customer needs to see verbatim rather than the generic message below.
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Unable to create payment intent." });
  }
}

/**
 * 100%-covered-by-points-and-wallet checkout: Stripe can't create a €0 (or
 * card-portion-less) intent, so debit the wallet directly and fulfil through
 * the same handleSucceededPayment() path a real Stripe payment would take,
 * via a synthetic pseudo-intent (mirrors walletCheckoutService.js's ticket
 * wallet-only sentinel). If fulfillment throws, compensate by refunding the
 * wallet debit and any redeemed points — mirrors payTicketWithWallet's
 * rollback for the same failure mode.
 */
async function payWithWalletOnly({ userId, walletPortionMinor, pointsToRedeem, pointsDiscountMinor, metadata, tier, kind, appliedDiscount }) {
  const debited = await deferWalletDebit(userId, walletPortionMinor, {
    type: "purchase",
    description: `${tier.name} (${kind})`,
    referenceType: kind,
    referenceId: tier.id,
    initiatedBy: "customer"
  });
  if (!debited.success) {
    const e = new Error(debited.error || "Could not charge your V.Wallet balance.");
    e.status = 400;
    throw e;
  }

  const syntheticIntent = {
    id: `wallet_${crypto.randomUUID()}`,
    object: "payment_intent",
    status: "succeeded",
    amount: walletPortionMinor,
    amount_received: walletPortionMinor,
    currency: env.stripe.currency,
    created: Math.floor(Date.now() / 1000),
    metadata: {
      ...metadata,
      wallet_portion_minor: String(walletPortionMinor),
      points_redeemed: String(pointsToRedeem || 0)
    }
  };

  try {
    await handleSucceededPayment(syntheticIntent);
  } catch (fulfillmentError) {
    console.error("[payments] Wallet-only fulfillment failed:", fulfillmentError.message);
    await creditWallet(userId, walletPortionMinor, {
      type: "refund",
      description: `Refund — could not complete ${kind} payment`,
      referenceType: kind,
      referenceId: tier.id,
      initiatedBy: "customer"
    }).catch((refundErr) => {
      console.error("[payments] CRITICAL: wallet refund after failed fulfillment also failed:", refundErr.message);
    });
    if (pointsToRedeem > 0) {
      await awardPoints(userId, pointsToRedeem, {
        description: "Points refunded — payment could not be completed",
        referenceType: kind,
        referenceId: tier.id,
        initiatedBy: "customer"
      }).catch(() => {});
    }
    const e = new Error("We couldn't complete this payment, so your V.Wallet balance (and any points used) have been refunded. Please try again.");
    e.status = 500;
    throw e;
  }

  return {
    mode: "wallet_only",
    paymentIntentId: syntheticIntent.id,
    walletPortionMinor,
    pointsDiscountMinor,
    amount: walletPortionMinor,
    currency: env.stripe.currency,
    tier: { id: tier.id, name: tier.name },
    discountApplied: !!appliedDiscount,
    discountInfo: appliedDiscount
  };
}

export async function confirmPayment(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: "Stripe is not configured on the server." });
  }

  try {
    const { paymentIntentId, clientSecret } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required." });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method", "latest_charge"]
    });

    // This route is unauthenticated (guest donations/sponsorships/memberships
    // are legitimate), so the client secret — only known to whoever created
    // or received this specific PaymentIntent — is the proof of ownership
    // that gates triggering fulfillment here.
    if (!clientSecretMatches(intent, clientSecret)) {
      return res.status(403).json({ error: "Invalid payment confirmation request." });
    }

    if (intent.status !== "succeeded") {
      return res.status(202).json({ status: intent.status });
    }

    await handleSucceededPayment(intent);

    return res.status(200).json({ status: "succeeded" });
  } catch (error) {
    console.error("[payments] confirmPayment error:", error);
    return res.status(500).json({ error: "Unable to confirm payment." });
  }
}

export async function stripeWebhook(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).end();
  }

  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  const webhookSecret = getActiveWebhookSecret();

  if (!webhookSecret) {
    if (env.nodeEnv === "production") {
      console.error("[payments] A Stripe webhook signing secret is required in production.");
      return res.status(503).send("Webhook not configured.");
    }
    console.warn("[payments] Webhook signature verification skipped (dev only).");
  }

  let event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
      : JSON.parse(req.body.toString());
  } catch (error) {
    console.error("[payments] Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const StripeWebhookEvent = (await import("../models/StripeWebhookEvent.js")).default;
    const existing = await StripeWebhookEvent.findOne({ eventId: event.id }).lean();
    if (existing?.processed) {
      return res.json({ received: true, duplicate: true });
    }
  } catch (idempotencyErr) {
    console.warn("[payments] Webhook idempotency check skipped:", idempotencyErr.message);
  }

  if (event.type === "payment_intent.succeeded") {
    const baseIntent = event.data.object;

    let intent = baseIntent;
    try {
      intent = await stripe.paymentIntents.retrieve(baseIntent.id, {
        expand: ["payment_method", "latest_charge"],
      });
    } catch (err) {
      console.warn(
        "[payments] Webhook: could not expand payment intent, falling back to webhook payload:",
        err.message
      );
    }

    try {
      await handleSucceededPayment(intent);
      try {
        const StripeWebhookEvent = (await import("../models/StripeWebhookEvent.js")).default;
        await StripeWebhookEvent.findOneAndUpdate(
          { eventId: event.id },
          {
            eventId: event.id,
            eventType: event.type,
            paymentIntentId: intent.id,
            processed: true,
            error: "",
          },
          { upsert: true }
        );
      } catch {
        /* non-blocking */
      }
    } catch (fulfillmentError) {
      console.error("[payments] Webhook fulfillment failed:", fulfillmentError.message);
      try {
        const StripeWebhookEvent = (await import("../models/StripeWebhookEvent.js")).default;
        await StripeWebhookEvent.findOneAndUpdate(
          { eventId: event.id },
          {
            eventId: event.id,
            eventType: event.type,
            paymentIntentId: intent.id,
            processed: false,
            error: fulfillmentError.message,
          },
          { upsert: true }
        );
      } catch {
        /* non-blocking */
      }
      return res.status(500).json({ error: "Fulfillment failed." });
    }
  }

  try {
    const StripeWebhookEvent = (await import("../models/StripeWebhookEvent.js")).default;
    await StripeWebhookEvent.findOneAndUpdate(
      { eventId: event.id },
      {
        eventId: event.id,
        eventType: event.type,
        paymentIntentId: event.data.object?.object === "payment_intent" ? event.data.object.id : "",
        processed: true,
        error: "",
      },
      { upsert: true }
    );
  } catch (idempotencyWriteError) {
    console.warn("[payments] Webhook idempotency record failed:", idempotencyWriteError.message);
  }

  return res.json({ received: true });
}
