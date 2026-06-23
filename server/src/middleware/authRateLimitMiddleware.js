import { checkRateLimit } from "../utils/rateLimit.js";

function clientKey(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const email = String(req.body?.email || "").toLowerCase().trim();
  return `${ip}:${email || req.path}`;
}

/**
 * Rate limit sensitive auth endpoints (login, register, OTP, password reset).
 */
export function authRateLimit({ maxAttempts = 15, windowMs = 15 * 60_000 } = {}) {
  return (req, res, next) => {
    const key = clientKey(req);
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
