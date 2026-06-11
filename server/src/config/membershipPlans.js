/** Membership plan catalogue — keep in sync with public membership page tiers. */

export const MEMBERSHIP_TYPE_CODES = {
  student: "STU",
  privilegedSingle: "PS",
  privilegedFamily: "PF",
  premiumSingle: "PMS",
  premiumFamily: "PMF"
};

const ANNUAL_BENEFITS = {
  student: [
    "Invitations to exclusive events",
    "Monthly newsletter",
    "Valid for 1 Year",
    "Community updates and member news"
  ],
  privilegedSingle: [
    "10% discount on tickets",
    "Invitations to exclusive events",
    "Monthly newsletter",
    "Valid for 1 Year"
  ],
  privilegedFamily: [
    "20% discount on tickets",
    "Invitations to exclusive events",
    "Monthly newsletter",
    "Valid for 1 Year"
  ],
  premiumSingle: [
    "FREE entry to all events",
    "100% discount on tickets",
    "Priority registration",
    "Exclusive access and meet & greet opportunities"
  ],
  premiumFamily: [
    "FREE entry to all events",
    "100% discount on tickets",
    "Priority registration",
    "Exclusive access for your household"
  ]
};

export const MEMBERSHIP_PLANS = {
  student: {
    id: "student",
    name: "Student",
    matrixTitle: "Student Membership",
    feeMinor: 1500,
    feeLabel: "€15",
    durationDays: 365,
    durationYears: 1,
    description:
      "Perfect for students who want to explore, learn and stay connected with the community.",
    benefits: ANNUAL_BENEFITS.student
  },
  privilegedSingle: {
    id: "privilegedSingle",
    name: "Privileged Single",
    matrixTitle: "Privileged Single Membership",
    feeMinor: 3000,
    feeLabel: "€30",
    durationDays: 365,
    durationYears: 1,
    description:
      "Designed for individuals who want more value, priority and savings.",
    benefits: ANNUAL_BENEFITS.privilegedSingle,
    upgradeTo: "privilegedFamily"
  },
  privilegedFamily: {
    id: "privilegedFamily",
    name: "Privileged Family",
    matrixTitle: "Privileged Family Membership",
    feeMinor: 4500,
    feeLabel: "€45",
    durationDays: 365,
    durationYears: 1,
    description:
      "Great for families who want to enjoy more together while saving more.",
    benefits: ANNUAL_BENEFITS.privilegedFamily,
    upgradeTo: "premiumSingle"
  },
  premiumSingle: {
    id: "premiumSingle",
    name: "Premium Single",
    matrixTitle: "Premium Single Membership",
    feeMinor: 15000,
    feeLabel: "€150",
    durationDays: 365,
    durationYears: 1,
    description:
      "The ultimate experience for individuals who want the best of everything.",
    benefits: ANNUAL_BENEFITS.premiumSingle,
    upgradeTo: "premiumFamily"
  },
  premiumFamily: {
    id: "premiumFamily",
    name: "Premium Family",
    matrixTitle: "Premium Family Membership",
    feeMinor: 25000,
    feeLabel: "€250",
    durationDays: 365,
    durationYears: 1,
    description:
      "The complete family experience with premium benefits for everyone.",
    benefits: ANNUAL_BENEFITS.premiumFamily,
    upgradeTo: "patron"
  },
  /** @deprecated Legacy plan id — use premiumFamily. */
  family: {
    id: "premiumFamily",
    name: "Premium Family",
    matrixTitle: "Premium Family Membership",
    feeMinor: 25000,
    feeLabel: "€250",
    durationDays: 365,
    durationYears: 1,
    description:
      "The complete family experience with premium benefits for everyone.",
    benefits: ANNUAL_BENEFITS.premiumFamily,
    upgradeTo: "patron"
  },
  /** @deprecated Legacy plan id — use premiumSingle. */
  single: {
    id: "premiumSingle",
    name: "Premium Single",
    matrixTitle: "Premium Single Membership",
    feeMinor: 15000,
    feeLabel: "€150",
    durationDays: 365,
    durationYears: 1,
    description:
      "The ultimate experience for individuals who want the best of everything.",
    benefits: ANNUAL_BENEFITS.premiumSingle,
    upgradeTo: "premiumFamily"
  },
  /** @deprecated Legacy plan id — use privilegedFamily. */
  privileged: {
    id: "privilegedFamily",
    name: "Privileged Family",
    matrixTitle: "Privileged Family Membership",
    feeMinor: 4500,
    feeLabel: "€45",
    durationDays: 365,
    durationYears: 1,
    description:
      "Great for families who want to enjoy more together while saving more.",
    benefits: ANNUAL_BENEFITS.privilegedFamily,
    upgradeTo: "premiumSingle"
  },
  /** @deprecated Legacy VOWNL membership plan. */
  vownl: {
    id: "privilegedSingle",
    name: "Privileged Single",
    matrixTitle: "Privileged Single Membership",
    feeMinor: 3000,
    feeLabel: "€30",
    durationDays: 365,
    durationYears: 1,
    description:
      "Designed for individuals who want more value, priority and savings.",
    benefits: ANNUAL_BENEFITS.privilegedSingle,
    upgradeTo: "privilegedFamily"
  }
};

export const UPGRADE_PLANS = {
  patron: {
    id: "patron",
    title: "Become a Patron Member",
    description:
      "Support our mission at the highest level with naming recognition, VIP access, and invitations to exclusive patron gatherings.",
    ctaLabel: "Explore Upgrade",
    href: "/membership"
  },
  premiumFamily: {
    id: "premiumFamily",
    title: "Premium Family Membership",
    description: "Upgrade to cover your household with premium benefits and reserved seating.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-plans"
  },
  premiumSingle: {
    id: "premiumSingle",
    title: "Premium Single Membership",
    description: "Unlock premium single-member benefits and reserved seating at events.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-plans"
  },
  privilegedFamily: {
    id: "privilegedFamily",
    title: "Privileged Family Membership",
    description: "Extend member pricing and privileged seating benefits to your whole household.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-plans"
  }
};

const LEGACY_PLAN_ALIASES = {
  privileged: "privilegedFamily",
  vownl: "privilegedSingle",
  single: "premiumSingle",
  family: "premiumFamily"
};

export function resolvePlanId(planId) {
  if (!planId) return "";
  const key = String(planId);
  if (MEMBERSHIP_PLANS[key]) return MEMBERSHIP_PLANS[key].id || key;
  const alias = LEGACY_PLAN_ALIASES[key];
  if (alias) return alias;
  return key;
}

export function getPlan(planId) {
  if (!planId) return null;
  const key = String(planId);
  const plan = MEMBERSHIP_PLANS[key];
  if (plan) return plan;
  const alias = LEGACY_PLAN_ALIASES[key];
  return alias ? MEMBERSHIP_PLANS[alias] : null;
}

export function getUpgradePlan(upgradeId) {
  if (!upgradeId) return UPGRADE_PLANS.patron;
  return UPGRADE_PLANS[String(upgradeId)] || UPGRADE_PLANS.patron;
}
