import Stripe from "stripe";
import env from "../config/env.js";

let stripeInstance = null;
let cachedSecretKey = null;
let runtimeSecretKey = null;
let runtimeWebhookSecret = null;

/** @returns {"live" | "test" | "unknown"} */
export function getStripeKeyMode(secretKey = getActiveSecretKey()) {
  const key = String(secretKey || "");
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}

function getActiveSecretKey() {
  return runtimeSecretKey || env.stripe.secretKey;
}

export function setRuntimeStripeSecrets({ secretKey, webhookSecret } = {}) {
  if (secretKey !== undefined) {
    runtimeSecretKey = secretKey || null;
    stripeInstance = null;
    cachedSecretKey = null;
  }
  if (webhookSecret !== undefined) {
    runtimeWebhookSecret = webhookSecret || null;
  }
}

export function getActiveWebhookSecret() {
  return runtimeWebhookSecret || env.stripe.webhookSecret;
}

export async function loadStripeSecretsFromSettings() {
  try {
    const { getEffectiveStripeSecretKey, getEffectiveWebhookSecret } = await import(
      "./stripeSettingsService.js"
    );
    const secretKey = await getEffectiveStripeSecretKey();
    const webhookSecret = await getEffectiveWebhookSecret();
    if (secretKey) setRuntimeStripeSecrets({ secretKey, webhookSecret });
  } catch {
    // Settings DB may be unavailable during startup
  }
}

export function getStripe() {
  const secretKey = getActiveSecretKey();
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to server/.env or admin Stripe settings."
    );
  }

  if (stripeInstance && cachedSecretKey === secretKey) return stripeInstance;

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
  cachedSecretKey = secretKey;

  return stripeInstance;
}

export function isStripeConfigured() {
  return Boolean(getActiveSecretKey());
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
