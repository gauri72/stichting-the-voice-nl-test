export const VCOMMERCE_PLATFORM_FEE_PERCENT = 5;
export const VCOMMERCE_PAYOUT_DELAY_BUSINESS_DAYS = 5;

export const VCOMMERCE_PLANS = Object.freeze({
  starter: { id: "starter", name: "Starter", monthlyMinor: 699, annualMinor: 6900, foundingMonthlyMinor: 499, productLimit: 10 },
  growth: { id: "growth", name: "Growth", monthlyMinor: 1499, annualMinor: 14900, foundingMonthlyMinor: 999, productLimit: 50 },
  spotlight: { id: "spotlight", name: "Spotlight", monthlyMinor: 2999, annualMinor: 29900, foundingMonthlyMinor: 1999, productLimit: 250 },
});

export const VCOMMERCE_PROMOTIONS = Object.freeze({
  popular_pick_7d: { name: "Popular Picks Boost", amountMinor: 499, durationDays: 7 },
  category_14d: { name: "Category Feature", amountMinor: 799, durationDays: 14 },
  business_week_7d: { name: "Business of the Week", amountMinor: 1499, durationDays: 7 },
  homepage_7d: { name: "Homepage Spotlight", amountMinor: 2499, durationDays: 7 },
  social_media: { name: "Social Media Promotion", amountMinor: 1299 },
  picks_social: { name: "Popular Picks + Social", amountMinor: 1699 },
  complete: { name: "Complete Promotion", amountMinor: 3999 },
});

export function resolveVCommercePlan(planId) {
  return VCOMMERCE_PLANS[planId] || VCOMMERCE_PLANS.starter;
}
