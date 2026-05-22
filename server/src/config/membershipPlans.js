/** Membership plan catalogue — keep in sync with public membership matrix where applicable. */

export const MEMBERSHIP_PLANS = {
  family: {
    id: "family",
    name: "Premium Family Membership",
    matrixTitle: "Premium Family Membership",
    feeMinor: 25000,
    feeLabel: "€250",
    durationYears: 2,
    description:
      "Premium household membership with free entry to events within your validity period, reserved premium seating, lounge access, and VOWNL women-specific events at no extra cost.",
    benefits: [
      "Discount on all events within the validity period — 100% free entry",
      "Reserved premium seats",
      "Child tickets (max 2) — 50% discount",
      "Welcome kit included",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — free",
      "Celebrity priority meetup (invite only)",
    ],
    upgradeTo: "patron"
  },
  single: {
    id: "single",
    name: "Premium Single Membership",
    matrixTitle: "Premium Single Membership",
    feeMinor: 15000,
    feeLabel: "€150",
    durationYears: 2,
    description:
      "Premium individual membership with free entry to events within your validity period, reserved premium seating, lounge access, and VOWNL women-specific events at no extra cost.",
    benefits: [
      "Discount on all events within the validity period — 100% free entry",
      "Reserved premium seats",
      "Welcome kit included",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — free",
      "Celebrity priority meetup (invite only)",
    ],
    upgradeTo: "family"
  },
  privilegedFamily: {
    id: "privilegedFamily",
    name: "Privileged Family Membership",
    matrixTitle: "Privileged Family Membership",
    feeMinor: 4500,
    feeLabel: "€45",
    durationYears: 1,
    description:
      "Affordable family membership with event discounts, reserved privileged seating, and member benefits from Stichting The V.O.I.C.E. NL.",
    benefits: [
      "Discount on all events within the validity period — 10% discount",
      "Reserved privileged seats",
      "Child tickets (max 2) — 15% discount",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — 10% discount",
      "Celebrity priority meetup (invite only) — not included",
    ],
    upgradeTo: "single"
  },
  privilegedSingle: {
    id: "privilegedSingle",
    name: "Privileged Single Membership",
    matrixTitle: "Privileged Single Membership",
    feeMinor: 3000,
    feeLabel: "€30",
    durationYears: 1,
    description:
      "Affordable individual membership with event discounts, reserved privileged seating, and community updates from Stichting The V.O.I.C.E. NL.",
    benefits: [
      "Discount on all events within the validity period — 10% discount",
      "Reserved privileged seats",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — 10% discount",
      "Celebrity priority meetup (invite only) — not included",
    ],
    upgradeTo: "privilegedFamily"
  },
  /** @deprecated Legacy plan id — use privilegedFamily / privilegedSingle on new purchases. */
  privileged: {
    id: "privileged",
    name: "Privileged Family Membership",
    matrixTitle: "Privileged Family Membership",
    feeMinor: 4500,
    feeLabel: "€45",
    durationYears: 1,
    description:
      "Affordable family membership with event discounts, reserved privileged seating, and member benefits from Stichting The V.O.I.C.E. NL.",
    benefits: [
      "Discount on all events within the validity period — 10% discount",
      "Reserved privileged seats",
      "Child tickets (max 2) — 15% discount",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — 10% discount",
      "Celebrity priority meetup (invite only) — not included",
    ],
    upgradeTo: "single"
  },
  /** @deprecated Legacy VOWNL membership plan — benefit now listed on all tiers. */
  vownl: {
    id: "vownl",
    name: "Privileged Single Membership",
    matrixTitle: "Privileged Single Membership",
    feeMinor: 3000,
    feeLabel: "€30",
    durationYears: 1,
    description:
      "Affordable individual membership with event discounts, reserved privileged seating, and community updates from Stichting The V.O.I.C.E. NL.",
    benefits: [
      "Discount on all events within the validity period — 10% discount",
      "Reserved privileged seats",
      "Sponsor partner offers",
      "Lounge access during events",
      "VOWNL women-specific events discount — 10% discount",
      "Celebrity priority meetup (invite only) — not included",
    ],
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
  family: {
    id: "family",
    title: "Premium Family Membership",
    description: "Upgrade to cover your household with premium benefits and reserved seating.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-matrix"
  },
  single: {
    id: "single",
    title: "Premium Single Membership",
    description: "Unlock premium single-member benefits and reserved seating at events within your validity period.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-matrix"
  },
  privilegedFamily: {
    id: "privilegedFamily",
    title: "Privileged Family Membership",
    description: "Extend member pricing and privileged seating benefits to your whole household.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-matrix"
  }
};

const LEGACY_PLAN_ALIASES = {
  privileged: "privilegedFamily",
  vownl: "privilegedSingle",
};

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
