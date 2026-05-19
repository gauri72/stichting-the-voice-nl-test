import Stripe from "stripe";
import env from "../config/env.js";

let stripeInstance = null;

/** @returns {"live" | "test" | "unknown"} */
export function getStripeKeyMode(secretKey = env.stripe.secretKey) {
  const key = String(secretKey || "");
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}

export function getStripe() {
  if (stripeInstance) return stripeInstance;

  if (!env.stripe.secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to server/.env before processing payments."
    );
  }

  stripeInstance = new Stripe(env.stripe.secretKey, {
    apiVersion: "2024-06-20"
  });

  return stripeInstance;
}

export function isStripeConfigured() {
  return Boolean(env.stripe.secretKey);
}

export function logStripeConfiguration() {
  if (!isStripeConfigured()) {
    console.warn("[stripe] STRIPE_SECRET_KEY is not set — payments are disabled.");
    return;
  }

  const mode = getStripeKeyMode();
  console.log(`[stripe] Using ${mode} secret key.`);

  if (env.nodeEnv === "production" && mode === "test") {
    console.warn(
      "[stripe] NODE_ENV is production but STRIPE_SECRET_KEY is a test key (sk_test_...). Use sk_live_... from your live Stripe account."
    );
  }

  if (env.nodeEnv === "production" && !env.stripe.webhookSecret) {
    console.warn(
      "[stripe] STRIPE_WEBHOOK_SECRET is not set in production. Add a live-mode webhook signing secret from the Stripe dashboard."
    );
  }
}
