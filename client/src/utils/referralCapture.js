// Captures a ?ref=CODE referral link on first touch and holds it in sessionStorage so any
// of the three checkout flows (ticket, session, membership) can pre-fill it later, even if
// the visitor lands on the homepage or an events listing page rather than checkout directly.
// Mirrors authRedirect.js's voice_auth_intent pattern (same storage-unavailable handling,
// same TTL-on-read shape).

const REFERRAL_KEY = "voice_referral_code";
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — typical referral attribution window

/** Reads ?ref= from the current URL and stashes it (first-touch — only overwrites an
 * existing stashed code if a new one is actually present in the URL). Call once per page
 * load; safe to call on every route, not just checkout pages. Returns the captured code (so
 * a caller can show a "code applied" confirmation), or null if there was none to capture. */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref")?.trim();
    if (!code) return null;
    sessionStorage.setItem(REFERRAL_KEY, JSON.stringify({ code, capturedAt: Date.now() }));
    return code;
  } catch {
    // Storage can be unavailable in privacy-restricted browsers — the referral simply
    // won't pre-fill, checkout itself is unaffected.
    return null;
  }
}

/** Returns the pending referral code, or null if none / expired. */
export function getPendingReferralCode() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(REFERRAL_KEY) || "null");
    if (!parsed?.code) return null;
    if (Date.now() - Number(parsed.capturedAt || 0) > REFERRAL_TTL_MS) {
      sessionStorage.removeItem(REFERRAL_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

/** Call after a checkout that used the pending code actually completes — an abandoned or
 * incomplete checkout should NOT clear it, so the visitor can still redeem it later. */
export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REFERRAL_KEY);
  } catch {
    // no-op
  }
}
