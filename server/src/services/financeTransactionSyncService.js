import FinanceTransaction from "../models/FinanceTransaction.js";
import { nextFinanceId } from "../utils/financeUtils.js";

/**
 * Creates a paid income FinanceTransaction for a sponsorship/donation/membership/
 * ticket payment, so Finance & Audit reflects real revenue automatically.
 * Idempotent per (relatedModule, relatedRecordId) — safe to call from both
 * webhook-driven and admin-manual "mark as paid" paths without double-counting.
 */
export async function syncFinanceTransaction({
  category,
  description,
  relatedModule,
  relatedRecordId,
  relatedEventId,
  relatedEventName,
  amount,
  paymentMethod,
  paymentReference,
  transactionDate,
}) {
  if (!relatedRecordId) return null;
  const existing = await FinanceTransaction.findOne({ relatedModule, relatedRecordId });
  if (existing) return existing;

  const transactionId = await nextFinanceId("TXN");
  try {
    return await FinanceTransaction.create({
      transactionId,
      type: "income",
      category,
      description,
      relatedModule,
      relatedRecordId,
      relatedEventId: relatedEventId || null,
      relatedEventName: relatedEventName || "",
      amount: Math.abs(Number(amount) || 0),
      currency: "EUR",
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "",
      paymentReference: paymentReference || "",
      transactionDate: transactionDate || new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Lost the race to a concurrent caller (e.g. webhook + admin "mark as
      // paid" firing together) — the unique index already has the winner.
      return FinanceTransaction.findOne({ relatedModule, relatedRecordId });
    }
    throw error;
  }
}
