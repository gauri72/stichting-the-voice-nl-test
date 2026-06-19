import { MEMBERSHIP_PLANS } from "./membershipPlans.js";

export const ALL_MEMBERSHIP_PLAN_IDS = [
  "student",
  "privilegedSingle",
  "privilegedFamily",
  "premiumSingle",
  "premiumFamily",
];

export const DEFAULT_EVENT_CHECKOUT_SETTINGS = {
  enableMemberDiscount: true,
  enableMembershipUpsell: true,
  allowInstantMembershipBenefit: true,
  allowMembershipTicketBundle: true,
  eligibleMembershipTypes: [...ALL_MEMBERSHIP_PLAN_IDS],
  allowDiscountStacking: true,
  showPriceComparisonPreview: true,
};

export const DEFAULT_MEMBERSHIP_TICKET_KEYWORDS = [
  "student membership",
  "privileged single",
  "privileged family",
  "premium single",
  "premium family",
  "premium members",
  "membership",
  "member pass",
];

export const DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS = {
  allowPurchaseDuringTicketCheckout: true,
  allowRenewalDuringTicketCheckout: true,
  availableMembershipTypes: [...ALL_MEMBERSHIP_PLAN_IDS],
  membershipCheckoutDiscountPercent: 0,
  instantBenefitRules: {
    applyToCurrentTicketPurchase: true,
    allowWithCodeDiscounts: true,
  },
  enableTicketTailorLookup: true,
  useLiveTicketTailorApi: true,
  useSyncedTicketTailorData: true,
  membershipTicketKeywords: [...DEFAULT_MEMBERSHIP_TICKET_KEYWORDS],
  autoLinkTicketTailorMembership: true,
  applyTicketTailorMembershipDiscounts: true,
};

export function getPlanBenefitsSummary(planId) {
  const plan = MEMBERSHIP_PLANS[planId];
  if (!plan) return [];
  return plan.benefits || [];
}
