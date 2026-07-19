import {
  assertStripeWebhookScope,
  constructStripeWebhookEventWithScope,
  getActiveVCommerceWebhookSecretCandidates,
  getVCommerceStripe,
  isVCommerceStripeConfigured,
  STRIPE_WEBHOOK_SCOPE,
} from "../services/stripe.js";
import env from "../config/env.js";

// Webhook handler for the V.Commerce Stripe account — kept separate from
// paymentController.js's stripeWebhook() because it verifies against a
// different Stripe account (and therefore a different signing secret),
// not just a different event scope on the same account.
export async function stripeVCommerceWebhook(req, res) {
  if (!isVCommerceStripeConfigured()) {
    return res.status(503).end();
  }

  const stripe = getVCommerceStripe();
  const signature = req.headers["stripe-signature"];
  const webhookCandidates = getActiveVCommerceWebhookSecretCandidates();

  if (!webhookCandidates.length) {
    if (env.nodeEnv === "production") {
      console.error("[vcommerce] A Stripe webhook signing secret is required in production.");
      return res.status(503).send("Webhook not configured.");
    }
    console.warn("[vcommerce] Webhook signature verification skipped (dev only).");
  }

  let event;
  try {
    if (webhookCandidates.length) {
      const verified = constructStripeWebhookEventWithScope(
        stripe,
        req.body,
        signature,
        webhookCandidates
      );
      event = verified.event;
      assertStripeWebhookScope(event, verified.scope, {
        connectSecretConfigured: webhookCandidates.some(
          ({ scope }) => scope === STRIPE_WEBHOOK_SCOPE.CONNECTED
        ),
      });
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (error) {
    console.error("[vcommerce] Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const StripeWebhookEvent = (await import("../models/StripeWebhookEvent.js")).default;
  try {
    const existing = await StripeWebhookEvent.findOne({ eventId: event.id }).lean();
    if (existing?.processed) {
      return res.json({ received: true, duplicate: true });
    }
  } catch (idempotencyErr) {
    console.warn("[vcommerce] Webhook idempotency check skipped:", idempotencyErr.message);
  }

  try {
    if (
      event.type === "account.updated" ||
      event.type.startsWith("capability.") ||
      event.type.startsWith("account.external_account.")
    ) {
      const { handleConnectedAccountEvent } = await import("../services/businessStripeEventService.js");
      await handleConnectedAccountEvent(event);
    } else if (event.type.startsWith("payout.")) {
      const { handleConnectedPayoutEvent } = await import("../services/businessStripeEventService.js");
      await handleConnectedPayoutEvent(event);
    } else if (event.type.startsWith("charge.dispute.")) {
      const { handleBusinessDisputeEvent } = await import("../services/businessStripeEventService.js");
      await handleBusinessDisputeEvent(event);
    } else if (event.type === "charge.refunded") {
      const { handleExternalBusinessRefund } = await import("../services/businessStripeEventService.js");
      await handleExternalBusinessRefund(event);
    } else if (
      event.type === "checkout.session.completed" &&
      ["vcommerce_package", "vcommerce_application_package"].includes(event.data.object?.metadata?.payment_kind)
    ) {
      const { activatePackageFromCheckout } = await import("../services/vcommercePackageService.js");
      await activatePackageFromCheckout(event.data.object);
    } else if (
      event.type === "payment_intent.succeeded" &&
      event.data.object?.metadata?.payment_kind === "business_order"
    ) {
      const { fulfillOrder } = await import("../services/businessOrderService.js");
      await fulfillOrder(event.data.object);
    } else if (
      ["payment_intent.payment_failed", "payment_intent.canceled"].includes(event.type) &&
      event.data.object?.metadata?.payment_kind === "business_order"
    ) {
      const { markOrderPaymentFailed } = await import("../services/businessOrderService.js");
      const intent = event.data.object;
      await markOrderPaymentFailed(intent.id, intent.last_payment_error?.message || event.type);
    }
  } catch (processingError) {
    console.error("[vcommerce] Webhook event processing failed:", processingError.message);
    try {
      await StripeWebhookEvent.findOneAndUpdate(
        { eventId: event.id },
        {
          eventId: event.id,
          eventType: event.type,
          paymentIntentId: event.data.object?.object === "payment_intent" ? event.data.object.id : "",
          processed: false,
          error: processingError.message,
        },
        { upsert: true }
      );
    } catch {
      /* non-blocking */
    }
    return res.status(500).json({ error: "V.Commerce webhook processing failed." });
  }

  try {
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
    console.warn("[vcommerce] Webhook idempotency record failed:", idempotencyWriteError.message);
  }

  return res.json({ received: true });
}
