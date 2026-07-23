import { checkRateLimit } from "../utils/rateLimit.js";

function clientIp(req) {
  return req.ip || "unknown";
}

/**
 * Basic per-IP rate limit for public, unauthenticated POST endpoints that
 * have no captcha (newsletter signup, waitlist join, etc.).
 */
export function publicRateLimit({ maxAttempts = 10, windowMs = 60_000, keyPrefix = "public" } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${clientIp(req)}`;
    const result = checkRateLimit(key, { maxAttempts, windowMs });
    if (!result.allowed) {
      const retrySec = Math.ceil((result.retryAfterMs || windowMs) / 1000);
      res.setHeader("Retry-After", String(retrySec));
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }
    return next();
  };
}
