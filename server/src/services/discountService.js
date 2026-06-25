import Membership from "../models/Membership.js";
import Member from "../models/Member.js";
import DiscountRule from "../models/DiscountRule.js";
import DiscountUsage from "../models/DiscountUsage.js";
import ReferralReward from "../models/ReferralReward.js";
import Voucher from "../models/Voucher.js";
import { resolvePlanId } from "../config/membershipPlans.js";
import { STACKING_CONFIG } from "../config/discountConfig.js";
import { getNextSequence } from "../utils/sequence.js";
import { MEMBERSHIP_SOURCE } from "./membershipDetectionService.js";
import {
  buildMemberRuleFromTicketTailorDiscount,
  getTicketTailorDiscountRule,
} from "../utils/membershipDiscountRules.js";
import {
  CUSTOMER_MEMBERSHIP_MESSAGES,
  sanitizeCustomerDiscountLabel,
} from "../utils/membershipDisplayLabels.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import { sendReferralRewardEarnedEmail, sendDiscountExpiringEmail } from "./discountMailer.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import {
  normalizeMembershipType,
  resolveMembershipPlanId,
} from "../utils/membershipTypeUtils.js";

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isRuleActive(rule) {
  if (!rule || rule.status !== "active") return false;
  const now = new Date();
  if (rule.startDate && now < new Date(rule.startDate)) return false;
  if (rule.expiryDate && now > new Date(rule.expiryDate)) return false;
  if (rule.usageLimit != null && rule.usedCount >= rule.usageLimit) return false;
  return true;
}

function appliesToOrderType(rule, orderType) {
  if (!rule) return false;
  if (!rule.appliesTo || rule.appliesTo === "both") return true;
  return rule.appliesTo === orderType;
}

function appliesToEvent(rule, eventId) {
  if (!eventId) return true;
  if (!Array.isArray(rule.eligibleEventIds) || rule.eligibleEventIds.length === 0) return true;
  return rule.eligibleEventIds.some((id) => id.toString() === eventId.toString());
}

export async function getActiveMembership(userId) {
  if (!userId) return null;

  const membership = await Membership.findOne({
    userId,
    active: true,
    endsAt: { $gt: new Date() },
  })
    .sort({ endsAt: -1 })
    .lean();

  if (membership) return membership;

  const member = await Member.findOne({
    userId,
    membershipStatus: "active",
    expiryDate: { $gt: new Date() },
  })
    .sort({ expiryDate: -1 })
    .lean();

  if (member) {
    return {
      planId: member.planId || member.membershipType,
      endsAt: member.expiryDate,
      active: true,
    };
  }

  return null;
}

export async function getAutomaticMemberDiscount(userId, eventId, orderType = "tickets") {
  const membership = await getActiveMembership(userId);
  if (!membership) return null;
  return getAutomaticMemberDiscountForPlan(resolvePlanId(membership.planId), eventId, orderType);
}

export async function getAutomaticMemberDiscountForPlan(planId, eventId, orderType = "tickets") {
  if (!planId) return null;

  const resolvedPlanId = resolvePlanId(planId);

  const rules = await DiscountRule.find({
    type: "automatic_member",
    status: "active",
    eligibleMembershipTypes: resolvedPlanId,
  }).lean();

  const rule = rules.find((r) => isRuleActive(r) && appliesToOrderType(r, orderType) && appliesToEvent(r, eventId));
  if (!rule) return null;

  return {
    ...rule,
    id: rule._id.toString(),
    membershipPlanId: resolvedPlanId,
    label: rule.label || "Member Discount Applied",
  };
}

function logTTDiscount(tag, payload = {}) {
  const parts = Object.entries(payload)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}] ${parts}`);
}

/**
 * Resolve membership discount rule with TicketTailor-first priority.
 * 1. TicketTailor admin discount rules
 * 2. Local automatic member discount rule (DiscountRule collection)
 * 3. Default membershipCheckoutDiscountPercent from settings
 */
export async function getMembershipDiscountRule({
  planId,
  membershipType,
  source,
  eventId,
  orderType = "tickets",
  settings = null,
}) {
  const rawType = membershipType || "";
  const normalized = normalizeMembershipType(rawType);
  const resolvedPlanId = resolveMembershipPlanId({ planId, membershipType: rawType });

  logTTDiscount("TT_DISCOUNT_LOOKUP_STARTED", {
    rawType,
    normalizedPlanId: resolvedPlanId,
    source: source || "",
    eventId: eventId || "",
  });

  const resolvedSettings = settings || (await getMembershipCheckoutSettings());

  if (
    source === MEMBERSHIP_SOURCE.TICKETTAILOR &&
    resolvedSettings.applyTicketTailorMembershipDiscounts !== false
  ) {
    const ttConfig = getTicketTailorDiscountRule(resolvedPlanId, resolvedSettings, rawType);
    if (ttConfig?.discountValue > 0) {
      const rule = buildMemberRuleFromTicketTailorDiscount(ttConfig, rawType, resolvedPlanId);
      if (rule) {
        logTTDiscount("TT_DISCOUNT_RULE_FOUND", {
          discountType: rule.discountType,
          discountValue: rule.discountValue,
          label: rule.label,
        });
        return rule;
      }
    }
    logTTDiscount("TT_DISCOUNT_RULE_NOT_FOUND", { planId: resolvedPlanId, rawType });
  }

  if (resolvedPlanId) {
    const dbRule = await getAutomaticMemberDiscountForPlan(resolvedPlanId, eventId, orderType);
    if (dbRule) {
      logTTDiscount("TT_DISCOUNT_RULE_FOUND", { source: "LOCAL_DB", planId: resolvedPlanId });
      return dbRule;
    }
  }

  const fallbackPercent = resolvedSettings.membershipCheckoutDiscountPercent || 0;
  if (fallbackPercent > 0) {
    logTTDiscount("TT_DISCOUNT_RULE_FOUND", { source: "SETTINGS_FALLBACK", discountValue: fallbackPercent });
    return {
      type: "automatic_member",
      discountType: "percentage",
      discountValue: fallbackPercent,
      appliesTo: "both",
      label: `Member Discount (${normalized.label || "Membership"} — ${fallbackPercent}%)`,
      membershipPlanId: resolvedPlanId,
      allowStacking: true,
      source: source || "LOCAL",
    };
  }

  logTTDiscount("TT_DISCOUNT_RULE_NOT_FOUND", { planId: resolvedPlanId, rawType, source: source || "" });
  return null;
}

export async function countUserDiscountUsage(discountId, userId, userEmail) {
  const query = { discountId };
  if (userId) {
    query.userId = userId;
  } else if (userEmail) {
    query.userEmail = userEmail.toLowerCase();
  } else {
    return 0;
  }
  return DiscountUsage.countDocuments(query);
}

async function validateRuleEligibility(rule, { userId, email, eventId, orderType, subtotalMinor }) {
  if (!isRuleActive(rule)) throwError("This discount is not currently active.");
  if (!appliesToOrderType(rule, orderType)) throwError("This discount does not apply to this purchase type.");
  if (!appliesToEvent(rule, eventId)) throwError("This discount is not valid for this event.");

  if (rule.minimumOrderAmount > 0 && subtotalMinor < rule.minimumOrderAmount) {
    throwError(`Minimum order amount is €${(rule.minimumOrderAmount / 100).toFixed(2)}.`);
  }

  if (rule.type === "personalized_code" && !rule.isPublic) {
    const normalizedEmail = String(email || "").toLowerCase();
    const assignedEmail = String(rule.assignedEmail || "").toLowerCase();
    const assignedUserId = rule.assignedUserId?.toString();

    if (assignedUserId && userId && assignedUserId !== userId.toString()) {
      throwError("This code is assigned to another user.");
    }
    if (assignedEmail && normalizedEmail !== assignedEmail) {
      throwError("This code is not valid for your email address.");
    }
    if (!assignedUserId && !assignedEmail) {
      throwError("This personalized code has no assigned user.");
    }
  }

  if (rule.type === "referral_code" && STACKING_CONFIG.preventReferralSelfUse) {
    const referrerId = rule.referrerUserId?.toString();
    const referrerEmail = String(rule.referrerEmail || "").toLowerCase();
    if (referrerId && userId && referrerId === userId.toString()) {
      throwError("You cannot use your own referral code.");
    }
    if (referrerEmail && email && referrerEmail === email.toLowerCase()) {
      throwError("You cannot use your own referral code.");
    }
  }

  if (rule.usageLimitPerUser != null) {
    const userUsage = await countUserDiscountUsage(rule._id, userId, email);
    if (userUsage >= rule.usageLimitPerUser) {
      throwError("You have reached the usage limit for this code.");
    }
  }

  return rule;
}

export async function findDiscountByCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const rule = await DiscountRule.findOne({
    code: normalized,
    type: { $in: ["personalized_code", "referral_code", "campaign_code", "event_code", "membership_code"] },
  }).lean();

  if (rule) return { ...rule, id: rule._id.toString() };

  const voucher = await Voucher.findOne({ code: normalized, status: "active" }).lean();
  if (voucher) {
    return {
      id: voucher._id.toString(),
      _id: voucher._id,
      code: voucher.code,
      type: "campaign_code",
      discountType: voucher.discountType === "fixed" ? "fixed_amount" : "percentage",
      discountValue: voucher.discountValue,
      appliesTo: "tickets",
      eligibleEventIds: voucher.eligibleEvents || [],
      usageLimit: voucher.usageLimit,
      usedCount: voucher.usedCount,
      expiryDate: voucher.expiryDate,
      status: voucher.status === "active" ? "active" : "paused",
      isLegacyVoucher: true,
      allowStacking: true,
    };
  }

  return null;
}

export async function validateDiscountCode(code, userId, email, eventId, orderType = "tickets", subtotalMinor = 0) {
  const rule = await findDiscountByCode(code);
  if (!rule) throwError("Invalid discount code.");

  if (rule.isLegacyVoucher) {
    if (rule.expiryDate && new Date() > new Date(rule.expiryDate)) throwError("This code has expired.");
    if (rule.usageLimit != null && rule.usedCount >= rule.usageLimit) throwError("This code has reached its usage limit.");
    if (!appliesToEvent(rule, eventId)) throwError("This code is not valid for this event.");
    return { ...rule, label: "Voucher Discount" };
  }

  await validateRuleEligibility(rule, { userId, email, eventId, orderType, subtotalMinor });

  const labels = {
    personalized_code: "Personal Code Discount",
    referral_code: "Referral Discount",
    campaign_code: "Campaign Discount",
    event_code: "Event Discount",
    membership_code: "Membership Discount",
  };

  return {
    ...rule,
    label: labels[rule.type] || "Discount Applied",
  };
}

export function calculateDiscountAmount(subtotalMinor, rule) {
  if (!rule || subtotalMinor <= 0) return 0;

  if (rule.discountType === "free_ticket" || (rule.discountType === "percentage" && rule.discountValue >= 100)) {
    return subtotalMinor;
  }
  if (rule.discountType === "percentage") {
    return Math.min(subtotalMinor, Math.round(subtotalMinor * (rule.discountValue / 100)));
  }
  if (rule.discountType === "fixed_amount") {
    return Math.min(subtotalMinor, Math.round(rule.discountValue * 100));
  }
  return 0;
}

export function calculateReferralReward(orderTotalMinor, rule) {
  if (!rule || rule.type !== "referral_code") return 0;
  if (!rule.rewardType || rule.rewardValue <= 0) return 0;

  if (rule.rewardType === "percentage") {
    return Math.round(orderTotalMinor * (rule.rewardValue / 100));
  }
  if (rule.rewardType === "fixed_amount" || rule.rewardType === "credit") {
    return Math.round(rule.rewardValue * 100);
  }
  return rule.rewardValue;
}

export function resolveStackedDiscounts({
  subtotalMinor,
  memberRule,
  codeRule,
  orderType = "tickets",
}) {
  let memberDiscountMinor = 0;
  let codeDiscountMinor = 0;
  let memberLabel = "";
  let codeLabel = "";

  if (memberRule && appliesToOrderType(memberRule, orderType)) {
    memberDiscountMinor = calculateDiscountAmount(subtotalMinor, memberRule);
    memberLabel = sanitizeCustomerDiscountLabel(
      memberRule.label || CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied
    );
  }

  const remaining = Math.max(0, subtotalMinor - memberDiscountMinor);

  if (codeRule) {
    const canStack =
      !memberRule ||
      memberRule.allowStacking !== false ||
      codeRule.allowStacking !== false ||
      STACKING_CONFIG.allowMultipleCodes;

    const memberIsReferral = codeRule.type === "referral_code";
    const memberIsPersonal = ["personalized_code", "campaign_code", "event_code", "membership_code"].includes(codeRule.type);

    let stackingAllowed = canStack;
    if (memberRule && memberDiscountMinor > 0) {
      if (memberIsReferral && !STACKING_CONFIG.allowMemberPlusReferral) stackingAllowed = false;
      if (memberIsPersonal && !STACKING_CONFIG.allowMemberPlusVoucher) stackingAllowed = false;
    }

    if (stackingAllowed || memberDiscountMinor === 0) {
      if (STACKING_CONFIG.stackingMode === "highest" && memberDiscountMinor > 0) {
        const codeOnly = calculateDiscountAmount(subtotalMinor, codeRule);
        if (codeOnly > memberDiscountMinor) {
          memberDiscountMinor = 0;
          memberLabel = "";
          codeDiscountMinor = codeOnly;
        }
      } else if (STACKING_CONFIG.stackingMode === "first" && memberDiscountMinor > 0) {
        codeDiscountMinor = 0;
      } else {
        codeDiscountMinor = calculateDiscountAmount(remaining, codeRule);
      }
      codeLabel = codeRule.label || "Code Discount";
    } else if (STACKING_CONFIG.stackingMode === "highest") {
      const codeOnly = calculateDiscountAmount(subtotalMinor, codeRule);
      if (codeOnly > memberDiscountMinor) {
        memberDiscountMinor = codeOnly;
        memberLabel = codeRule.label || "Discount Applied";
        codeDiscountMinor = 0;
      }
    }
  }

  const isReferral = codeRule?.type === "referral_code" && codeDiscountMinor > 0;

  return {
    memberDiscountMinor,
    codeDiscountMinor,
    voucherDiscountMinor: codeRule?.isLegacyVoucher ? codeDiscountMinor : 0,
    referralDiscountMinor: isReferral ? codeDiscountMinor : 0,
    personalDiscountMinor: !isReferral && codeRule && !codeRule.isLegacyVoucher ? codeDiscountMinor : 0,
    memberLabel,
    codeLabel,
    memberRule,
    codeRule,
    discountAmountMinor: memberDiscountMinor + codeDiscountMinor,
  };
}

export async function buildUsageId() {
  const seq = await getNextSequence("discount_usage");
  const year = new Date().getFullYear();
  return `DUS-${year}-${String(seq).padStart(6, "0")}`;
}

export async function buildRewardId() {
  const seq = await getNextSequence("referral_reward");
  const year = new Date().getFullYear();
  return `RWD-${year}-${String(seq).padStart(6, "0")}`;
}

export async function recordDiscountUsage({
  discountRule,
  userId,
  userEmail,
  orderId,
  eventId,
  membershipId,
  subtotalBeforeDiscount,
  discountAmount,
  totalAfterDiscount,
}) {
  if (!discountRule || discountAmount <= 0) return null;

  const usageId = await buildUsageId();
  const usage = await DiscountUsage.create({
    usageId,
    discountId: discountRule._id || discountRule.id,
    code: discountRule.code || "",
    type: discountRule.type,
    userId: userId || null,
    userEmail: userEmail || "",
    orderId: orderId || "",
    eventId: eventId || null,
    membershipId: membershipId || "",
    subtotalBeforeDiscount,
    discountAmount,
    totalAfterDiscount,
    referrerUserId: discountRule.referrerUserId || null,
    referrerEmail: discountRule.referrerEmail || "",
    rewardAmount: 0,
    rewardStatus: discountRule.type === "referral_code" ? "pending" : "approved",
    usedAt: new Date(),
  });

  if (!discountRule.isLegacyVoucher) {
    await DiscountRule.findByIdAndUpdate(discountRule._id || discountRule.id, { $inc: { usedCount: 1 } });
  }

  if (discountRule.type === "referral_code") {
    const rewardValue = calculateReferralReward(totalAfterDiscount, discountRule);
    const rewardId = await buildRewardId();
    await ReferralReward.create({
      rewardId,
      discountId: discountRule._id || discountRule.id,
      referrerUserId: discountRule.referrerUserId || null,
      referrerEmail: discountRule.referrerEmail || "",
      buyerUserId: userId || null,
      buyerEmail: userEmail || "",
      orderId: orderId || "",
      eventId: eventId || null,
      discountGiven: discountAmount,
      rewardType: discountRule.rewardType || "manual",
      rewardValue: discountRule.rewardValue || 0,
      rewardStatus: "pending",
    });
    usage.rewardAmount = rewardValue;
    await usage.save();

    if (discountRule.referrerEmail) {
      await sendReferralRewardEarnedEmail({
        email: discountRule.referrerEmail,
        firstName: discountRule.referrerName?.split(" ")[0] || "",
        rewardValue: `€${(rewardValue / 100).toFixed(2)}`,
      }).catch((err) => console.error("[discounts] referral reward email failed:", err.message));
    }
  }

  return usage;
}

export async function applyDiscountsToOrder({
  userId,
  email,
  eventId,
  orderType = "tickets",
  subtotalMinor,
  discountCode,
  voucherCode,
  memberPlanId = null,
  memberRuleOverride = null,
  allowStacking = true,
}) {
  const code = discountCode || voucherCode;
  let memberRule = memberRuleOverride || null;

  if (!memberRule && memberPlanId) {
    memberRule = await getAutomaticMemberDiscountForPlan(memberPlanId, eventId, orderType);
  } else if (!memberRule && userId) {
    memberRule = await getAutomaticMemberDiscount(userId, eventId, orderType);
  }

  let codeRule = null;
  if (code?.trim()) {
    codeRule = await validateDiscountCode(code, userId, email, eventId, orderType, subtotalMinor);
  }

  if (!allowStacking && memberRule && codeRule) {
    const memberOnly = resolveStackedDiscounts({ subtotalMinor, memberRule, codeRule: null, orderType });
    const codeOnly = resolveStackedDiscounts({ subtotalMinor, memberRule: null, codeRule, orderType });
    if (codeOnly.discountAmountMinor > memberOnly.discountAmountMinor) {
      memberRule = null;
    } else {
      codeRule = null;
    }
  }

  return resolveStackedDiscounts({
    subtotalMinor,
    memberRule,
    codeRule,
    orderType,
  });
}

/**
 * Emails the assigned recipient of any active, personally-assigned discount
 * code expiring within `windowDays`, once per code (tracked via
 * expiryReminderSentAt so re-running this never double-sends).
 */
export async function sendExpiringDiscountReminders(windowDays = 3) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const rules = await DiscountRule.find({
    status: "active",
    assignedEmail: { $ne: "" },
    expiryDate: { $gte: now, $lte: windowEnd },
    expiryReminderSentAt: null,
  }).lean();

  let sent = 0;
  for (const rule of rules) {
    try {
      const user = rule.assignedUserId ? await User.findById(rule.assignedUserId).select("firstName").lean() : null;
      const event = rule.eligibleEventIds?.length
        ? await Event.findById(rule.eligibleEventIds[0]).select("title").lean()
        : null;

      await sendDiscountExpiringEmail({
        email: rule.assignedEmail,
        firstName: user?.firstName || "",
        discountCode: rule.code,
        expiryDate: rule.expiryDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        eventName: event?.title || "",
      });
      await DiscountRule.updateOne({ _id: rule._id }, { expiryReminderSentAt: new Date() });
      sent += 1;
    } catch (err) {
      console.error(`[discounts] expiry reminder failed for rule ${rule._id}:`, err.message);
    }
  }
  return { checked: rules.length, sent };
}
