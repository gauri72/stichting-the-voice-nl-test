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
import { isEventPublished } from "./eventService.js";

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

/**
 * Replaces the old appliesToEvent(). Precisely expresses "event A's VIP+General tickets"
 * and "event B's General-only tickets" as independent scopes — a flat ticketTypeIds array
 * crossed with a separate eligibleEventIds array cannot do this without ambiguity (see
 * DiscountRule.js's eventScopes comment).
 *
 * Resolution order:
 *   1. applyToAllEvents: true -> matches anything.
 *   2. A populated eventScopes entry for this eventId -> matches per that entry's
 *      applyToAllTicketTypes/ticketTypeIds.
 *   3. No eventScopes at all (rule not yet migrated to the new fields) -> fall back to the
 *      legacy eligibleEventIds array, event-level only (no ticket-type restriction), which
 *      is exactly today's pre-migration behavior.
 *   4. None of the above -> fail closed (no match), rather than silently treating an
 *      explicitly-scoped-to-nothing rule as "applies everywhere."
 */
export function appliesToEventAndTicketType(rule, eventId, ticketTypeId) {
  if (!eventId) return true;
  if (rule.applyToAllEvents) return true;

  const scopes = Array.isArray(rule.eventScopes) ? rule.eventScopes : [];
  if (scopes.length > 0) {
    const scope = scopes.find((s) => String(s.eventId) === String(eventId));
    if (!scope) return false;
    if (scope.applyToAllTicketTypes) return true;
    if (!ticketTypeId) return false;
    return (scope.ticketTypeIds || []).some((id) => String(id) === String(ticketTypeId));
  }

  // Not migrated yet (no eventScopes at all): replicate the legacy appliesToEvent()
  // semantics exactly, where an empty/missing eligibleEventIds meant "all events."
  if (!Array.isArray(rule.eligibleEventIds) || rule.eligibleEventIds.length === 0) return true;
  return rule.eligibleEventIds.some((id) => String(id) === String(eventId));
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

export async function getAutomaticMemberDiscount(userId, eventId, orderType = "tickets", ticketTypeId = null) {
  const membership = await getActiveMembership(userId);
  if (!membership) return null;
  return getAutomaticMemberDiscountForPlan(resolvePlanId(membership.planId), eventId, orderType, ticketTypeId);
}

export async function getAutomaticMemberDiscountForPlan(planId, eventId, orderType = "tickets", ticketTypeId = null) {
  if (!planId) return null;
  if (eventId && !(await isEventPublished(eventId))) return null;

  const resolvedPlanId = resolvePlanId(planId);

  const rules = await DiscountRule.find({
    type: "automatic_member",
    status: "active",
    eligibleMembershipTypes: resolvedPlanId,
  }).lean();

  const rule = rules.find(
    (r) => isRuleActive(r) && appliesToOrderType(r, orderType) && appliesToEventAndTicketType(r, eventId, ticketTypeId)
  );
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
  ticketTypeId = null,
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
    const dbRule = await getAutomaticMemberDiscountForPlan(resolvedPlanId, eventId, orderType, ticketTypeId);
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

async function validateRuleEligibility(rule, { userId, email, eventId, ticketTypeId, orderType, subtotalMinor }) {
  // Checked first so an unpublished event always produces this specific message, ahead of
  // any other validation failure that might otherwise fire for the same rule.
  if (eventId && !(await isEventPublished(eventId))) {
    throwError("This discount is not available for unpublished events.");
  }
  if (!isRuleActive(rule)) throwError("This discount is not currently active.");
  if (!appliesToOrderType(rule, orderType)) throwError("This discount does not apply to this purchase type.");
  if (!appliesToEventAndTicketType(rule, eventId, ticketTypeId)) {
    throwError(ticketTypeId ? "This discount is not valid for this ticket type." : "This discount is not valid for this event.");
  }

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

  // Single-recipient vouchers (assignedEmail set at creation, Voucher.js's assignedEmail field):
  // an empty assignedEmail means the voucher is redeemable by anyone with the code.
  if (rule.isLegacyVoucher && rule.assignedEmail) {
    const normalizedEmail = String(email || "").toLowerCase();
    if (normalizedEmail !== String(rule.assignedEmail).toLowerCase()) {
      throwError("This voucher is not valid for your email address.");
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
      applyToAllEvents: voucher.applyToAllEvents || false,
      eventScopes: voucher.eventScopes || [],
      assignedEmail: voucher.assignedEmail || "",
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

export async function validateDiscountCode(
  code, userId, email, eventId, orderType = "tickets", subtotalMinor = 0, ticketTypeId = null
) {
  const rule = await findDiscountByCode(code);
  if (!rule) throwError("Invalid discount code.");

  await validateRuleEligibility(rule, { userId, email, eventId, ticketTypeId, orderType, subtotalMinor });

  if (rule.isLegacyVoucher) {
    return { ...rule, label: "Voucher Discount" };
  }

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
  // Lets a caller that already computed a capped/reduced member discount
  // (the per-event membership redemption cap — see membershipTicketCapService.js
  // and pricePreviewService.js::calculatePricePreview) supply that exact amount
  // instead of having it recomputed from the full, uncapped subtotalMinor here.
  // null/undefined (every existing caller) preserves today's behavior exactly.
  memberDiscountAmountOverride = null,
}) {
  let memberDiscountMinor = 0;
  let codeDiscountMinor = 0;
  let memberLabel = "";
  let codeLabel = "";

  if (memberRule && appliesToOrderType(memberRule, orderType)) {
    memberDiscountMinor = memberDiscountAmountOverride != null
      ? memberDiscountAmountOverride
      : calculateDiscountAmount(subtotalMinor, memberRule);
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

  if (discountRule.isLegacyVoucher) {
    // Pre-existing gap: vouchers redeemed via the findDiscountByCode() pseudo-rule path
    // never had their usedCount incremented at all, so a "single-use" voucher was
    // silently reusable until its usageLimit field (often unset) said otherwise.
    const voucherId = discountRule._id || discountRule.id;
    const updated = await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } }, { new: true });
    if (updated && updated.usageLimit != null && updated.usedCount >= updated.usageLimit) {
      await Voucher.updateOne({ _id: voucherId }, { status: "used" });
    }
  } else {
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
  ticketTypeId = null,
  orderType = "tickets",
  subtotalMinor,
  discountCode,
  voucherCode,
  memberPlanId = null,
  memberRuleOverride = null,
  memberDiscountAmountOverride = null,
  allowStacking = true,
  // Set by callers (pricePreviewService.js) that have already made a complete, authoritative
  // decision about this line's member discount themselves — including "no discount applies,"
  // e.g. because the per-event redemption cap left zero eligible units. Without this, a null
  // memberRuleOverride was indistinguishable from "no override was computed, please look one
  // up yourself," so a logged-in member's discount got silently re-derived from scratch here
  // via getAutomaticMemberDiscount — uncapped — even when the caller had deliberately decided
  // not to apply one. Other callers (ticketOrderService, checkoutDiscountController,
  // sessionPlatformService) don't pre-resolve member eligibility, so they still rely on this
  // lookup by leaving the default false.
  skipAutomaticMemberLookup = false,
}) {
  // Belt-and-suspenders: every code path this function can take to find a discount
  // (member rule, code/voucher) already checks published status internally, but this is
  // the single highest-traffic entry point (ticketOrderService, pricePreviewService,
  // checkoutDiscountController, sessionPlatformService all call it), so it gets its own
  // explicit early check too.
  if (eventId && !(await isEventPublished(eventId))) {
    throwError("This discount is not available for unpublished events.");
  }

  const code = discountCode || voucherCode;
  let memberRule = memberRuleOverride || null;

  if (!memberRule && !skipAutomaticMemberLookup && memberPlanId) {
    memberRule = await getAutomaticMemberDiscountForPlan(memberPlanId, eventId, orderType, ticketTypeId);
  } else if (!memberRule && !skipAutomaticMemberLookup && userId) {
    memberRule = await getAutomaticMemberDiscount(userId, eventId, orderType, ticketTypeId);
  }

  let codeRule = null;
  if (code?.trim()) {
    codeRule = await validateDiscountCode(code, userId, email, eventId, orderType, subtotalMinor, ticketTypeId);
  }

  if (!allowStacking && memberRule && codeRule) {
    const memberOnly = resolveStackedDiscounts({ subtotalMinor, memberRule, codeRule: null, orderType, memberDiscountAmountOverride });
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
    memberDiscountAmountOverride,
  });
}

/**
 * Per-ticket-type discounting entry point. Resolves each line item's member/code discount
 * independently (so "one code per ticket type, membership stacks per ticket type" falls out
 * naturally from calling the single-line primitive above once per line) and sums the results
 * for an order-level total. Kept as a thin wrapper around applyDiscountsToOrder rather than a
 * rewrite, so the existing stacking logic in resolveStackedDiscounts() is reused unchanged.
 */
export async function applyDiscountsToOrderLines({
  userId,
  email,
  eventId,
  orderType = "tickets",
  lineItems = [],
  memberPlanId = null,
  memberRuleOverride = null,
  allowStacking = true,
  skipAutomaticMemberLookup = false,
}) {
  const lines = [];
  let memberDiscountMinor = 0;
  let codeDiscountMinor = 0;
  let voucherDiscountMinor = 0;
  let referralDiscountMinor = 0;
  let personalDiscountMinor = 0;
  let discountAmountMinor = 0;
  // Representative label/rule for cart-level display (e.g. BookingPricePreview's banner) —
  // taken from the first line that actually carries that discount, since different lines
  // can now have different codes/membership rules under per-ticket-type scoping.
  let memberLabel = "";
  let codeLabel = "";
  let memberRule = null;
  let codeRule = null;

  for (const line of lineItems) {
    const lineMemberRuleOverride =
      line.memberRuleOverride !== undefined ? line.memberRuleOverride : memberRuleOverride;
    const lineMemberDiscountAmountOverride =
      line.memberDiscountAmountOverrideMinor !== undefined ? line.memberDiscountAmountOverrideMinor : null;
    let result;
    let codeError = null;
    try {
      result = await applyDiscountsToOrder({
        userId,
        email,
        eventId,
        ticketTypeId: line.ticketTypeId,
        orderType,
        subtotalMinor: line.lineSubtotalMinor,
        discountCode: line.discountCode,
        voucherCode: line.voucherCode,
        memberPlanId,
        memberRuleOverride: lineMemberRuleOverride,
        memberDiscountAmountOverride: lineMemberDiscountAmountOverride,
        allowStacking,
        skipAutomaticMemberLookup,
      });
    } catch (err) {
      // A code valid for one ticket-type line but not another must not blow up the whole
      // multi-line preview/order — degrade this one line to "no code applied" (member
      // discount, if any, still computed normally) and surface the reason on the line.
      // Re-validating a *specific* code's input field still throws via validateDiscountCode()
      // directly (checkoutDiscountController.validateCode) — only this aggregator absorbs it.
      codeError = err.message;
      result = await applyDiscountsToOrder({
        userId,
        email,
        eventId,
        ticketTypeId: line.ticketTypeId,
        orderType,
        subtotalMinor: line.lineSubtotalMinor,
        discountCode: null,
        voucherCode: null,
        memberPlanId,
        memberRuleOverride: lineMemberRuleOverride,
        memberDiscountAmountOverride: lineMemberDiscountAmountOverride,
        allowStacking,
        skipAutomaticMemberLookup,
      });
    }

    lines.push({ ticketTypeId: line.ticketTypeId, ...result, codeError });

    memberDiscountMinor += result.memberDiscountMinor;
    codeDiscountMinor += result.codeDiscountMinor;
    voucherDiscountMinor += result.voucherDiscountMinor;
    referralDiscountMinor += result.referralDiscountMinor;
    personalDiscountMinor += result.personalDiscountMinor;
    discountAmountMinor += result.discountAmountMinor;

    if (!memberLabel && result.memberDiscountMinor > 0) {
      memberLabel = result.memberLabel;
      memberRule = result.memberRule;
    }
    if (!codeLabel && result.codeDiscountMinor > 0) {
      codeLabel = result.codeLabel;
      codeRule = result.codeRule;
    }
  }

  return {
    lineItems: lines,
    memberDiscountMinor,
    codeDiscountMinor,
    voucherDiscountMinor,
    referralDiscountMinor,
    personalDiscountMinor,
    discountAmountMinor,
    memberLabel,
    codeLabel,
    memberRule,
    codeRule,
  };
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
