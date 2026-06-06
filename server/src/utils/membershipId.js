import { MEMBERSHIP_TYPE_CODES, resolvePlanId } from "../config/membershipPlans.js";
import { getNextSequence } from "./sequence.js";

/**
 * VOICE-YYYY-TYPE-XXXXXX
 * @param {string} planId
 * @param {Date} [startDate]
 */
export async function buildMembershipId(planId, startDate = new Date()) {
  const resolved = resolvePlanId(planId);
  const typeCode = MEMBERSHIP_TYPE_CODES[resolved];
  if (!typeCode) {
    throw new Error(`Unknown membership plan for ID generation: ${planId}`);
  }
  const year = startDate.getUTCFullYear();
  const seq = await getNextSequence(`membership_id_${year}`);
  return `VOICE-${year}-${typeCode}-${String(seq).padStart(6, "0")}`;
}
