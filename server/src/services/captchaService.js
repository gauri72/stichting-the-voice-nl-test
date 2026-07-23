import env from "../config/env.js";

const CAPTCHA_ERROR_MESSAGE = "Please complete the security check and try again.";

export function isCaptchaVerificationEnabled() {
  return env.nodeEnv === "production" && Boolean(env.captcha.turnstileSecretKey);
}

export async function verifyTurnstileToken({ token, ip } = {}) {
  // In production, a missing secret must fail closed (503), not silently skip
  // verification — validateProductionEnv() already blocks startup without one,
  // but this covers any case where the secret is unset/cleared after boot.
  if (env.nodeEnv === "production" && !env.captcha.turnstileSecretKey) {
    const error = new Error("Security verification is unavailable. Please try again later.");
    error.status = 503;
    throw error;
  }

  if (!isCaptchaVerificationEnabled()) {
    return { success: true, skipped: true };
  }

  if (!token?.trim()) {
    const error = new Error(CAPTCHA_ERROR_MESSAGE);
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams({
    secret: env.captcha.turnstileSecretKey,
    response: token.trim()
  });

  if (ip) {
    params.set("remoteip", ip);
  }

  let response;
  try {
    response = await fetch(env.captcha.turnstileVerifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
  } catch (error) {
    const serviceError = new Error("Security verification is unavailable. Please try again.");
    serviceError.status = 503;
    serviceError.cause = error;
    throw serviceError;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const error = new Error(CAPTCHA_ERROR_MESSAGE);
    error.status = 400;
    error.details = payload?.["error-codes"] || [];
    throw error;
  }

  return payload;
}
