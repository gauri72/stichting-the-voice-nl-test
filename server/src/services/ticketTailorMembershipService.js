import { resolvePlanId } from "../config/membershipPlans.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import {
  detectByEmail,
  detectByUserId,
  MEMBERSHIP_SOURCE,
  MEMBERSHIP_STATUS,
} from "./membershipDetectionService.js";
import { calculatePricePreview } from "./pricePreviewService.js";
import CheckoutSession from "../models/CheckoutSession.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "./checkoutAuditService.js";
import {
  normalizeMembershipType,
  resolveMembershipPlanId,
} from "../utils/membershipTypeUtils.js";
import {
  getTicketTailorDiscountRule,
} from "../utils/membershipDiscountRules.js";

export { getTicketTailorDiscountRule, buildMemberRuleFromTicketTailorDiscount } from "../utils/membershipDiscountRules.js";

function logTT(tag, payload = {}) {
  const parts = Object.entries(payload)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}] ${parts}`);
}

export async function detectMembershipForCheckout(email, userId, options = {}) {
  const settings = options.settings || (await getMembershipCheckoutSettings());
  const isLoggedIn = Boolean(options.isLoggedIn && userId);

  console.log("[TICKETTAILOR_MEMBERSHIP_PRIORITY_STARTED] email=%s userId=%s", email || "", userId || "");

  let unified;
  if (isLoggedIn && userId) {
    unified = await detectByUserId(userId, {
      email,
      isLoggedIn: true,
      membershipCode: options.membershipCode || null,
      sessionUserId: userId,
      settings,
    });
  } else if (email) {
    unified = await detectByEmail(email, {
      isLoggedIn: false,
      membershipCode: options.membershipCode || null,
      sessionUserId: options.sessionUserId || null,
      settings,
    });
  } else {
    unified = {
      found: false,
      status: MEMBERSHIP_STATUS.NON_MEMBER,
      source: MEMBERSHIP_SOURCE.NONE,
      membershipType: "",
      memberUntil: "",
      eligibleForBenefits: false,
      requiresLogin: false,
      requiresAccountLinking: false,
      membership: null,
      isActive: false,
      isExpired: false,
    };
  }

  const planId = resolveMembershipPlanId({
    planId: unified.membership?.planId,
    membershipType: unified.membershipType || unified.membership?.planName,
  });
  const rawType = unified.membershipType || unified.membership?.planName || "";
  const normalized = normalizeMembershipType(rawType);

  logTT("TT_MEMBERSHIP_DETECTED", {
    email: email || "",
    source: unified.source,
    status: unified.status,
    rawType,
  });
  logTT("TT_MEMBERSHIP_TYPE_RAW", { type: rawType });
  logTT("TT_MEMBERSHIP_TYPE_NORMALIZED", { planId, label: normalized.label });

  let discountRule = null;
  let discountType = null;
  let discountValue = null;

  if (
    unified.isActive &&
    unified.source === MEMBERSHIP_SOURCE.TICKETTAILOR &&
    settings.applyTicketTailorMembershipDiscounts !== false
  ) {
    logTT("TT_DISCOUNT_LOOKUP_STARTED", { planId, eventId: options.eventId || "" });
    discountRule = getTicketTailorDiscountRule(planId, settings, rawType);
    if (discountRule) {
      discountType = discountRule.discountType;
      discountValue = discountRule.discountValue;
      logTT("TT_DISCOUNT_RULE_FOUND", { discountType, discountValue });
    } else {
      logTT("TT_DISCOUNT_RULE_NOT_FOUND", { planId });
    }
  }

  const ticketTailorMembershipId =
    unified.source === MEMBERSHIP_SOURCE.TICKETTAILOR
      ? unified.membership?.membershipNumber || ""
      : unified.membership?.ticketTailorMembership?.membershipNumber || "";

  if (unified.isActive && unified.source === MEMBERSHIP_SOURCE.TICKETTAILOR) {
    console.log("[MEMBERSHIP_PRIORITY_SELECTED_TICKETTAILOR] email=%s type=%s until=%s", email || "", unified.membershipType, unified.memberUntil);
  }

  return {
    ...unified,
    membershipDetected: unified.found,
    membershipSource: unified.source,
    membershipStatus: unified.status,
    ticketTailorMembershipId,
    discountRule,
    discountType,
    discountValue,
    normalizedMembershipType: normalized.label,
    normalizedPlanId: planId,
    requiresLoginForBenefits:
      unified.isActive &&
      !isLoggedIn &&
      settings.requireLoginForTicketTailorBenefits !== false &&
      (unified.source === MEMBERSHIP_SOURCE.TICKETTAILOR || unified.requiresLogin),
  };
}

export async function applyTicketTailorMembershipBenefit({
  checkoutSessionId,
  email,
  eventId,
  membershipSource,
  membershipType,
  userId = null,
  isLoggedIn = false,
}) {
  const session = await CheckoutSession.findOne({
    sessionId: checkoutSessionId,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) {
    const err = new Error("Checkout session expired or not found.");
    err.status = 404;
    throw err;
  }

  const checkoutEmail = email || session.email || session.attendeeDetails?.email || "";
  const resolvedEventId = eventId || session.eventId?.toString?.() || session.eventId;

  const detection = await detectMembershipForCheckout(checkoutEmail, userId, {
    isLoggedIn,
    membershipCode: session.membershipCode || null,
  });

  if (!detection.isActive) {
    const err = new Error("No active membership found to apply benefits.");
    err.status = 400;
    throw err;
  }

  if (membershipSource && detection.source !== membershipSource && detection.source !== MEMBERSHIP_SOURCE.BOTH) {
    const err = new Error("Membership source mismatch. Please refresh and try again.");
    err.status = 400;
    throw err;
  }

  const settings = await getMembershipCheckoutSettings();
  if (
    detection.requiresLoginForBenefits &&
    !isLoggedIn
  ) {
    const err = new Error("Please log in to apply membership benefits.");
    err.status = 401;
    err.code = "MEMBER_LOGIN_REQUIRED";
    throw err;
  }

  const items = session.selectedTickets || [];
  const preview = await calculatePricePreview({
    eventId: resolvedEventId,
    items,
    userId,
    email: checkoutEmail,
    isLoggedIn,
    includeMembership: session.includeMembership,
    selectedPlanId: session.selectedMembership?.planId || null,
    purchaseType: session.selectedMembership?.purchaseType || "NEW",
    discountCode: session.discountCode || null,
    applyMemberBenefit: true,
    sessionId: checkoutSessionId,
    membershipCode: session.membershipCode || null,
  });

  const membershipDiscountAmount = preview.discountResult?.memberDiscountMinor || 0;

  await CheckoutSession.findOneAndUpdate(
    { sessionId: checkoutSessionId },
    {
      membershipDetected: true,
      membershipSource: detection.source,
      membershipStatus: detection.status,
      membershipType: detection.membershipType || membershipType || "",
      memberUntil: detection.memberUntil || "",
      ticketTailorMembershipId: detection.ticketTailorMembershipId || "",
      requiresLogin: detection.requiresLoginForBenefits || false,
      membershipBenefitApplied: preview.membershipBenefitApplied,
      membershipDiscountAmount,
      membershipDiscountRule: detection.discountRule || null,
      membershipDetectionResult: detection,
      applyMemberBenefit: true,
      pricePreview: preview,
      appliedDiscounts: preview.appliedDiscounts,
    }
  );

  console.log(
    "[MEMBER_DISCOUNT_APPLIED_FROM_TICKETTAILOR] email=%s type=%s discount=%s total=%s",
    checkoutEmail,
    detection.membershipType,
    membershipDiscountAmount,
    preview.combined?.grandTotalMinor
  );
  console.log("[CHECKOUT_TOTAL_RECALCULATED] sessionId=%s total=%s", checkoutSessionId, preview.combined?.grandTotalMinor);

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.MEMBER_DISCOUNT_APPLIED_AFTER_LOGIN,
    sessionId: checkoutSessionId,
    userId,
    email: checkoutEmail,
    eventId: resolvedEventId,
    memberStatus: detection.status,
    details: {
      source: detection.source,
      membershipType: detection.membershipType,
      discountAmount: membershipDiscountAmount,
    },
  });

  return {
    success: true,
    detection,
    preview,
    membershipDiscountAmount,
    membershipSource: detection.source,
  };
}
