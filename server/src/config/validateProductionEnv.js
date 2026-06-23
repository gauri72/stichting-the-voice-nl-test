import env from "./env.js";

/**
 * Fail fast when critical production secrets are missing.
 */
export function validateProductionEnv() {
  if (env.nodeEnv !== "production") return;

  const missing = [];
  if (!env.auth.jwtSecret) missing.push("JWT_SECRET");
  if (!env.captcha.turnstileSecretKey) missing.push("TURNSTILE_SECRET_KEY");
  if (!env.stripe.webhookSecret && env.stripe.secretKey) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (missing.length) {
    console.error(
      `[startup] Production requires: ${missing.join(", ")}. Set these environment variables before deploying.`
    );
    process.exit(1);
  }
}
