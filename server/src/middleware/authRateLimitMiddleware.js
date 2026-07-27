import { checkRateLimit } from "../utils/rateLimit.js";

function clientKey(req) {
  const ip = req.ip || "unknown";
  const email = String(req.body?.email || "").toLowerCase().trim();
  return `${ip}:${email || req.path}`;
}

/**
 * Rate limit sensitive auth endpoints (login, register, OTP, password reset).
 *
 * keyFn defaults to IP+email, correct for these pre-login endpoints (there's no
 * req.user yet). Callers behind requireAuth — e.g. walletRoutes.js — should pass
 * a keyFn based on req.user.id instead, since req.body never carries an email
 * there and IP+path alone can't tell two different authenticated customers apart.
 */
export function authRateLimit({ maxAttempts = 15, windowMs = 15 * 60_000, keyFn = clientKey } = {}) {
  return (req, res, next) => {
    const key = keyFn(req);
    const result = checkRateLimit(`auth:${key}`, { maxAttempts, windowMs });
    if (!result.allowed) {
      const retrySec = Math.ceil((result.retryAfterMs || windowMs) / 1000);
      res.setHeader("Retry-After", String(retrySec));
      return res.status(429).json({
        error: "Too many attempts. Please wait a few minutes and try again.",
      });
    }
    return next();
  };
}

export function adminLoginRateLimit() {
  return authRateLimit({ maxAttempts: 10, windowMs: 15 * 60_000 });
}
