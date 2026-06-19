/** Payment statuses that mean the order is fully settled (tickets may be issued). */
export const SETTLED_PAYMENT_STATUSES = ["paid", "free"];

export function isOrderPaymentSettled(status) {
  return SETTLED_PAYMENT_STATUSES.includes(String(status || "").toLowerCase());
}

export function freeOrderPaymentReference(orderId) {
  return `free:${orderId}`;
}
