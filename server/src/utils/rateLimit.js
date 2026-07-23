const buckets = new Map();
const SWEEP_INTERVAL_MS = 5 * 60_000;

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Single-process by design — this deployment runs one Render web service
 * instance, so a per-process Map gives every attacker/client a consistent
 * bucket. If this ever moves to a multi-instance/horizontally-scaled
 * deployment, replace this with a shared store (e.g. a Mongo-backed counter
 * or Redis) before that becomes ineffective.
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

// Keys are derived from request data (IP, email, session id, etc.), so the
// map grows without bound over the process lifetime unless swept. Buckets
// whose attempts have all expired are removed periodically.
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    const stillActive = bucket.attempts.some((ts) => now - ts < bucket.windowMs);
    if (!stillActive) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();
