import env from "./env.js";

/**
 * Fail fast when critical production secrets are missing.
 */
export function getMissingProductionEnv(config = env) {
  if (config.nodeEnv !== "production") return [];

  const missing = [];
  if (!config.auth.jwtSecret) missing.push("JWT_SECRET");
  if (!config.captcha.turnstileSecretKey) missing.push("TURNSTILE_SECRET_KEY");
  if (!config.stripe.webhookSecret && config.stripe.secretKey) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }
  if (
    config.stripe.connectEnabled &&
    !config.stripe.connectWebhookSecret
  ) {
    missing.push("STRIPE_CONNECT_WEBHOOK_SECRET");
  }

  return missing;
}

export function validateProductionEnv() {
  const missing = getMissingProductionEnv();

  if (missing.length) {
    console.error(
      `[startup] Production requires: ${missing.join(", ")}. Set these environment variables before deploying.`
    );
    process.exit(1);
  }
}
