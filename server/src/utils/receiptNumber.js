/**
 * Deterministic receipt number from Stripe payment intent (stable across webhook + client confirm).
 */
export function buildReceiptNumber(paymentIntentId, createdSeconds) {
  const ms = Number(createdSeconds) * 1000;
  const date = Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date();
  const year = date.getUTCFullYear();
  const tail = String(paymentIntentId || "")
    .replace(/^pi_/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase()
    .padStart(8, "0");
  return `VOICE-${year}-${tail}`;
}
