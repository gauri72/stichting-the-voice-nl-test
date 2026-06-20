import { DEFAULT_TICKETTAILOR_DISCOUNT_RULES } from "../config/checkoutDefaults.js";
import { normalizeMembershipType, resolveMembershipPlanId } from "./membershipTypeUtils.js";
import { formatMembershipDiscountLabel } from "./membershipDisplayLabels.js";

export function getTicketTailorDiscountRule(planId, settings, membershipType = "") {
  const resolved = resolveMembershipPlanId({ planId, membershipType });
  const rules = settings?.ticketTailorDiscountRules || DEFAULT_TICKETTAILOR_DISCOUNT_RULES;
  return rules[resolved] || rules[planId] || null;
}

export function buildMemberRuleFromTicketTailorDiscount(discountRule, membershipType, planId) {
  if (!discountRule || discountRule.discountValue == null || discountRule.discountValue <= 0) {
    return null;
  }

  const normalized = normalizeMembershipType(membershipType);

  return {
    type: "automatic_member",
    discountType: discountRule.discountType,
    discountValue: discountRule.discountValue,
    appliesTo: "both",
    label: formatMembershipDiscountLabel(normalized.label || membershipType, discountRule),
    membershipPlanId: resolveMembershipPlanId({ planId, membershipType }),
    allowStacking: true,
    source: "TICKETTAILOR",
  };
}
