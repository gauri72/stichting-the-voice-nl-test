import { getStripe, isStripeConfigured } from "./stripe.js";
import { getActivePaymentProvider } from "./stripeSettingsService.js";
import env from "../config/env.js";

/**
 * Payment integration structure for ticket orders.
 * Uses Stripe when configured; otherwise returns a placeholder for development.
 */
export async function createTicketPaymentIntent({
  orderId,
  orderNumber,
  amountMinor,
  eventTitle,
  orderType = "TICKET_ONLY",
  includeMembership = false,
  membershipPlanId = "",
}) {
  if (amountMinor <= 0) {
    return {
      mode: "free",
      paymentIntentId: null,
      clientSecret: null,
      amountMinor: 0,
    };
  }

  if (!isStripeConfigured()) {
    const err = new Error("Payment provider is not configured. Contact the event organiser.");
    err.status = 503;
    throw err;
  }
  if (!(await getActivePaymentProvider())) {
    const err = new Error("Online payments are currently disabled. Please try again later.");
    err.status = 503;
    throw err;
  }

  const stripe = getStripe();
  const paymentKind =
    orderType === "TICKET_AND_MEMBERSHIP" ? "ticket_and_membership" : "event_ticket";

  const intent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: env.stripe.currency,
    metadata: {
      payment_kind: paymentKind,
      order_id: orderId,
      order_number: orderNumber,
      event_title: eventTitle || "",
      include_membership: includeMembership ? "true" : "false",
      membership_plan_id: membershipPlanId || "",
    },
    automatic_payment_methods: { enabled: true },
  });
  return {
    mode: "stripe",
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    amountMinor,
  };
}

export async function confirmTicketPayment(paymentIntentId) {
  if (!paymentIntentId) {
    return { success: true, mode: "free" };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Payment provider is not configured." };
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status === "succeeded") {
      return { success: true, mode: "stripe", intent };
    }
    if (intent.status === "processing") {
      return { success: false, error: "Payment is still processing. Please wait a moment and try again." };
    }
    if (intent.status === "requires_payment_method") {
      return { success: false, error: "Payment was not completed." };
    }
    return { success: false, error: `Payment status: ${intent.status}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
