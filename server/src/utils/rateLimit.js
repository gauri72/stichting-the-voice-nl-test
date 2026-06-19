const buckets = new Map();

/**
 * Simple in-memory sliding-window rate limiter.
 */
export function checkRateLimit(key, { maxAttempts = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucket = buckets.get(key) || { attempts: [], windowMs, maxAttempts };

  bucket.attempts = bucket.attempts.filter((ts) => now - ts < windowMs);

  if (bucket.attempts.length >= maxAttempts) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.attempts[0]) };
  }

  bucket.attempts.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}
