/** Global discount stacking and referral settings */

export const DISCOUNT_TYPES = [
  "automatic_member",
  "personalized_code",
  "referral_code",
  "campaign_code",
  "event_code",
  "membership_code",
];

export const DISCOUNT_VALUE_TYPES = ["percentage", "fixed_amount", "free_ticket"];

export const APPLIES_TO = ["tickets", "memberships", "both"];

export const DISCOUNT_STATUSES = ["active", "inactive", "paused", "expired", "archived"];

export const DISCOUNT_SOURCES = [
  "platform",
  "voucher",
  "campaign",
  "referral",
  "personal",
  "event",
  "legacy",
  "tickettailor",
  "membership",
];

/** Discount rule types that may appear as copyable codes on the member dashboard */
export const DASHBOARD_CODE_TYPES = [
  "personalized_code",
  "campaign_code",
  "event_code",
  "membership_code",
];

export const REWARD_TYPES = ["credit", "free_ticket", "fixed_amount", "percentage", "manual"];

// Reward types whose rewardValue is real currency (minor units) — free_ticket/manual
// rewards aren't euros, so anything that sums/formats reward money must exclude them.
export const CURRENCY_REWARD_TYPES = ["credit", "fixed_amount", "percentage"];

export const REWARD_STATUSES = ["pending", "approved", "paid", "cancelled"];

export const STACKING_CONFIG = {
  allowMemberPlusVoucher: true,
  allowMemberPlusReferral: true,
  allowMemberPlusPersonal: true,
  allowMultipleCodes: false,
  /** highest | first | stack */
  stackingMode: "stack",
  preventReferralSelfUse: true,
};
