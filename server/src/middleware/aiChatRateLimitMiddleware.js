import { checkRateLimit } from "../utils/rateLimit.js";

/**
 * Burst limit for V.Assist chat, on top of its existing daily usage cap —
 * keyed by authenticated customer, not IP, since this route already sits
 * behind requireAuth.
 */
export function aiChatRateLimit({ maxAttempts = 6, windowMs = 60_000 } = {}) {
  return (req, res, next) => {
    const key = `ai-chat:${req.user?.id || req.user?._id || "unknown"}`;
    const result = checkRateLimit(key, { maxAttempts, windowMs });
    if (!result.allowed) {
      const retrySec = Math.ceil((result.retryAfterMs || windowMs) / 1000);
      res.setHeader("Retry-After", String(retrySec));
      return res.status(429).json({
        error: "You're sending messages too quickly. Please slow down.",
      });
    }
    return next();
  };
}
