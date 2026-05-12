import env from "../config/env.js";
import { getTier } from "../config/sponsorshipTiers.js";
import { getStripe, isStripeConfigured } from "../services/stripe.js";
import { sendSponsorshipEmails } from "../services/mailer.js";

// In-memory guard so we don't email twice if both webhook and client confirmation fire.
const emailedIntents = new Set();

// Deterministic receipt number derived from the Stripe payment intent so it is
// stable across the webhook + client-side confirmation paths.
function buildReceiptNumber(paymentIntentId, createdSeconds) {
  const ms = Number(createdSeconds) * 1000;
  const date = Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date();
  const year = date.getUTCFullYear();
  const tail = String(paymentIntentId || "")
    .replace(/^pi_/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase()
    .padStart(8, "0");
  return `VOICE-${year}-${tail}`;
}

function describePaymentMethod(intent) {
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
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

export async function createPaymentIntent(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).json({
      error:
        "Stripe is not configured on the server. Set STRIPE_SECRET_KEY in server/.env."
    });
  }

  try {
    const { tierId, amount: customAmount, sponsor: rawSponsor } = req.body || {};
    const tier = getTier(tierId);
    if (!tier) {
      return res.status(400).json({ error: "Unknown sponsorship tier." });
    }

    const sponsor = sanitizeSponsor(rawSponsor);
    if (!sponsor.email || !isValidEmail(sponsor.email)) {
      return res.status(400).json({ error: "A valid sponsor email is required." });
    }
    if (!sponsor.name) {
      return res.status(400).json({ error: "Sponsor name is required." });
    }

    let amountMinor = tier.amount;
    if (tier.allowCustom && Number.isFinite(Number(customAmount))) {
      const requested = Math.round(Number(customAmount));
      amountMinor = Math.max(requested, tier.minAmount);
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: env.stripe.currency,
      automatic_payment_methods: { enabled: true },
      description: `Sponsorship - ${tier.name}`,
      metadata: {
        tier_id: tier.id,
        tier_name: tier.name,
        sponsor_name: sponsor.name,
        sponsor_email: sponsor.email,
        sponsor_phone: sponsor.phone,
        sponsor_organization: sponsor.organization,
        sponsor_country: sponsor.country,
        sponsor_message: sponsor.message ? sponsor.message.slice(0, 480) : ""
      }
    });

    return res.status(201).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: amountMinor,
      currency: env.stripe.currency,
      tier: { id: tier.id, name: tier.name }
    });
  } catch (error) {
    console.error("[payments] createPaymentIntent error:", error);
    return res.status(500).json({ error: "Unable to create payment intent." });
  }
}

// Fallback for environments without Stripe webhooks (e.g. local dev without the Stripe CLI).
// The client calls this after stripe.confirmPayment() resolves successfully.
export async function confirmPayment(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: "Stripe is not configured on the server." });
  }

  try {
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required." });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method", "latest_charge"]
    });

    if (intent.status !== "succeeded") {
      return res.status(202).json({ status: intent.status });
    }

    const meta = intent.metadata || {};
    const sponsor = {
      name: meta.sponsor_name,
      firstName: (meta.sponsor_name || "").split(" ")[0] || "",
      email: meta.sponsor_email,
      phone: meta.sponsor_phone,
      organization: meta.sponsor_organization,
      country: meta.sponsor_country,
      message: meta.sponsor_message
    };
    const tier = { id: meta.tier_id, name: meta.tier_name };

    await emailSponsorOnce({
      sponsor,
      tier,
      amountMinor: intent.amount_received || intent.amount,
      currency: intent.currency,
      paymentIntentId: intent.id,
      paymentCreated: intent.created,
      paymentMethod: describePaymentMethod(intent),
      receiptNumber: buildReceiptNumber(intent.id, intent.created)
    });

    return res.status(200).json({ status: "succeeded" });
  } catch (error) {
    console.error("[payments] confirmPayment error:", error);
    return res.status(500).json({ error: "Unable to confirm payment." });
  }
}

// Stripe webhook handler. Mounted with `express.raw()` body parser in app.js.
export async function stripeWebhook(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).end();
  }

  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    if (env.stripe.webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
    } else {
      // Webhook secret not configured: parse without signature verification.
      // This is acceptable only for local experimentation - never in production.
      event = JSON.parse(req.body.toString());
    }
  } catch (error) {
    console.error("[payments] Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const baseIntent = event.data.object;
    const meta = baseIntent.metadata || {};

    // The webhook payload omits expanded objects. Re-fetch with expansions so
    // the receipt PDF / email can show a precise payment method label.
    let intent = baseIntent;
    try {
      intent = await stripe.paymentIntents.retrieve(baseIntent.id, {
        expand: ["payment_method", "latest_charge"]
      });
    } catch (err) {
      console.warn(
        "[payments] Webhook: could not expand payment intent, falling back to webhook payload:",
        err.message
      );
    }

    const sponsor = {
      name: meta.sponsor_name,
      firstName: (meta.sponsor_name || "").split(" ")[0] || "",
      email: meta.sponsor_email,
      phone: meta.sponsor_phone,
      organization: meta.sponsor_organization,
      country: meta.sponsor_country,
      message: meta.sponsor_message
    };
    const tier = { id: meta.tier_id, name: meta.tier_name };

    await emailSponsorOnce({
      sponsor,
      tier,
      amountMinor: intent.amount_received || intent.amount,
      currency: intent.currency,
      paymentIntentId: intent.id,
      paymentCreated: intent.created,
      paymentMethod: describePaymentMethod(intent),
      receiptNumber: buildReceiptNumber(intent.id, intent.created)
    });
  }

  return res.json({ received: true });
}
