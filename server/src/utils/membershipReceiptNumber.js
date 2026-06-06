import { getNextSequence } from "./sequence.js";

/**
 * VOICE-RCP-YYYY-NNNNNN
 * @param {Date} [issuedAt]
 */
export async function buildMembershipReceiptNumber(issuedAt = new Date()) {
  const year = issuedAt.getUTCFullYear();
  const seq = await getNextSequence(`membership_receipt_${year}`);
  return `VOICE-RCP-${year}-${String(seq).padStart(6, "0")}`;
}
