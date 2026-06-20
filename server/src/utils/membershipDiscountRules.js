import { DEFAULT_TICKETTAILOR_DISCOUNT_RULES } from "../config/checkoutDefaults.js";
import { normalizeMembershipType, resolveMembershipPlanId } from "./membershipTypeUtils.js";

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
  const typeLabel = normalized.label || membershipType || planId || "Membership";
  const valueLabel =
    discountRule.discountType === "percentage"
      ? `${discountRule.discountValue}%`
      : `€${Number(discountRule.discountValue).toFixed(2)} off`;

  return {
    type: "automatic_member",
    discountType: discountRule.discountType,
    discountValue: discountRule.discountValue,
    appliesTo: "both",
    label: `TicketTailor Member Discount (${typeLabel} — ${valueLabel})`,
    membershipPlanId: resolveMembershipPlanId({ planId, membershipType }),
    allowStacking: true,
    source: "TICKETTAILOR",
  };
}
