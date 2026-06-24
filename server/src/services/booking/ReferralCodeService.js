import ReferralReward from "../../models/ReferralReward.js";
import { validateDiscountCode, calculateReferralReward } from "../discountService.js";

export async function validateReferralCode(code, context = {}) {
  const { userId = null, email = "", eventId = null, orderType = "tickets", subtotalMinor = 0 } = context;
  return validateDiscountCode(code, userId, email, eventId, orderType, subtotalMinor);
}

export async function listReferralRewards(filters = {}) {
  const query = {};
  if (filters.status) query.rewardStatus = filters.status;
  return ReferralReward.find(query).sort({ createdAt: -1 }).lean();
}

export { calculateReferralReward };
