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

export const DEFAULT_TICKETTAILOR_DISCOUNT_RULES = {
  student: { discountType: "percentage", discountValue: 0 },
  privilegedSingle: { discountType: "percentage", discountValue: 10 },
  privilegedFamily: { discountType: "percentage", discountValue: 20 },
  premiumSingle: { discountType: "percentage", discountValue: 100 },
  premiumFamily: { discountType: "percentage", discountValue: 100 },
};

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
  enableMembershipCodeValidation: true,
  enableTicketTailorMembershipPriority: true,
  checkTicketTailorBeforeLocal: true,
  requireLoginForTicketTailorBenefits: true,
  allowTicketTailorMembershipDiscountStacking: true,
  ticketTailorDiscountRules: { ...DEFAULT_TICKETTAILOR_DISCOUNT_RULES },
  // Master toggle for redeeming a membership discount without logging in, capped per event
  // per email (supersedes requireLoginForTicketTailorBenefits above when enabled — that
  // setting only ever covered Ticket Tailor-sourced memberships anyway). Off = full revert
  // to the pre-cap behavior (unlimited discount once logged in, login required as a guest).
  enableMembershipTicketDiscountCap: true,
  membershipDiscountedTicketCapPerEvent: 2,
};

export function getPlanBenefitsSummary(planId) {
  const plan = MEMBERSHIP_PLANS[planId];
  if (!plan) return [];
  return plan.benefits || [];
}
