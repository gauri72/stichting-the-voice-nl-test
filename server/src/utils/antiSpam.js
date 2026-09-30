const MIN_SUBMIT_MS = 3000;

/**
 * Two lightweight signals for plain-HTML public forms (contact/volunteer/
 * quote), paired with HoneypotField.jsx on the client:
 *  - `website`: a decoy input real users never see or reach by tab; any
 *    value means a script filled every field in the DOM blindly.
 *  - `formRenderedAt`: a client-side timestamp from when the form mounted —
 *    a submission arriving faster than a human could plausibly read and
 *    fill the form is almost certainly scripted.
 * Both are separate from Turnstile (per contactRoutes.js) — CAPTCHA-solving
 * services exist, so this catches what gets past it without relying on the
 * DOM structure a solver-driven bot might not fully emulate.
 */
export function isLikelyBotSubmission(body) {
  if (String(body?.website || "").trim()) return true;

  const renderedAt = Number(body?.formRenderedAt);
  if (Number.isFinite(renderedAt) && renderedAt > 0 && Date.now() - renderedAt < MIN_SUBMIT_MS) {
    return true;
  }

  return false;
}
