import Stripe from "stripe";
import env from "../config/env.js";

let stripeInstance = null;
let cachedSecretKey = null;
let runtimeSecretKey = null;
let runtimeWebhookSecret = null;
let runtimeConnectWebhookSecret = null;

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

export function setRuntimeStripeSecrets({
  secretKey,
  webhookSecret,
  connectWebhookSecret,
} = {}) {
  if (secretKey !== undefined) {
    runtimeSecretKey = secretKey || null;
    stripeInstance = null;
    cachedSecretKey = null;
  }
  if (webhookSecret !== undefined) {
    runtimeWebhookSecret = webhookSecret || null;
  }
  if (connectWebhookSecret !== undefined) {
    runtimeConnectWebhookSecret = connectWebhookSecret || null;
  }
}

export function getActiveWebhookSecret() {
  return runtimeWebhookSecret || env.stripe.webhookSecret;
}

export function getActiveConnectWebhookSecret() {
  return runtimeConnectWebhookSecret || env.stripe.connectWebhookSecret;
}

export const STRIPE_WEBHOOK_SCOPE = Object.freeze({
  PLATFORM: "platform",
  CONNECTED: "connected",
});

/**
 * Stripe gives every webhook event destination its own signing secret. The
 * platform-event and connected-account destinations may use the same URL, so
 * retain the destination scope that verified the request.
 */
export function getActiveWebhookSecretCandidates() {
  return [
    {
      scope: STRIPE_WEBHOOK_SCOPE.PLATFORM,
      secret: String(getActiveWebhookSecret() || "").trim(),
    },
    {
      scope: STRIPE_WEBHOOK_SCOPE.CONNECTED,
      secret: String(getActiveConnectWebhookSecret() || "").trim(),
    },
  ].filter((candidate) => candidate.secret);
}

export function getActiveWebhookSecrets() {
  return [...new Set(getActiveWebhookSecretCandidates().map(({ secret }) => secret))];
}

function normalizeWebhookSecretCandidates(candidates) {
  const normalized = [];
  const seen = new Set();

  for (const candidate of Array.isArray(candidates) ? candidates : [candidates]) {
    const isScoped = candidate && typeof candidate === "object";
    const secret = String(isScoped ? candidate.secret : candidate || "").trim();
    if (!secret) continue;

    const scope =
      isScoped && candidate.scope === STRIPE_WEBHOOK_SCOPE.CONNECTED
        ? STRIPE_WEBHOOK_SCOPE.CONNECTED
        : STRIPE_WEBHOOK_SCOPE.PLATFORM;
    const key = `${scope}:${secret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ scope, secret });
  }

  return normalized;
}

export function constructStripeWebhookEventWithScope(
  stripe,
  payload,
  signature,
  candidates
) {
  const normalized = normalizeWebhookSecretCandidates(candidates);

  let lastError = null;
  for (const { scope, secret } of normalized) {
    try {
      return {
        event: stripe.webhooks.constructEvent(payload, signature, secret),
        scope,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No Stripe webhook signing secret is configured.");
}

export function constructStripeWebhookEvent(stripe, payload, signature, secrets) {
  return constructStripeWebhookEventWithScope(
    stripe,
    payload,
    signature,
    secrets
  ).event;
}

export function isStripeConnectWebhookEventType(type) {
  const eventType = String(type || "");
  return (
    eventType === "account.updated" ||
    eventType.startsWith("capability.") ||
    eventType.startsWith("account.external_account.") ||
    eventType.startsWith("payout.")
  );
}

/**
 * A dedicated connected-account secret is intentionally lower scope: it may
 * authenticate only the connected-account events handled by this service.
 * When no dedicated secret exists, the historical platform secret remains
 * allowed for connected-account events for backwards compatibility.
 */
export function assertStripeWebhookScope(
  event,
  verifiedScope,
  { connectSecretConfigured = false } = {}
) {
  const connectedEventType = isStripeConnectWebhookEventType(event?.type);
  const hasConnectedAccount = Boolean(event?.account);

  if (verifiedScope === STRIPE_WEBHOOK_SCOPE.CONNECTED) {
    if (!connectedEventType || !hasConnectedAccount) {
      throw new Error(
        "Connected-account webhook secret cannot authorize this event."
      );
    }
    return;
  }

  if (
    connectSecretConfigured &&
    (connectedEventType || hasConnectedAccount)
  ) {
    throw new Error(
      "Connected-account event must use the connected-account webhook secret."
    );
  }
}

export async function loadStripeSecretsFromSettings() {
  try {
    const {
      getEffectiveStripeSecretKey,
      getEffectiveWebhookSecret,
      getEffectiveConnectWebhookSecret,
    } = await import(
      "./stripeSettingsService.js"
    );
    const secretKey = await getEffectiveStripeSecretKey();
    const webhookSecret = await getEffectiveWebhookSecret();
    const connectWebhookSecret = await getEffectiveConnectWebhookSecret();
    setRuntimeStripeSecrets({ secretKey, webhookSecret, connectWebhookSecret });
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

  if (
    env.nodeEnv === "production" &&
    env.stripe.connectEnabled &&
    !env.stripe.connectWebhookSecret
  ) {
    console.warn(
      "[stripe] Stripe Connect is enabled but STRIPE_CONNECT_WEBHOOK_SECRET is not set."
    );
  }
}
