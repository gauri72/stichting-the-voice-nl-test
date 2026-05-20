/** Membership plan catalogue — keep in sync with public membership matrix where applicable. */

export const MEMBERSHIP_PLANS = {
  family: {
    id: "family",
    name: "Family Membership Plan",
    matrixTitle: "Premium Family Membership",
    feeMinor: 25000,
    feeLabel: "€250",
    durationYears: 2,
    description:
      "Enjoy full access to all flagship events, reserved premium seating for your household, partner tickets, and exclusive member lounge access throughout the year.",
    benefits: [
      "All 4 flagship events — 100% free entry",
      "Partner ticket for all flagship events — 100% free",
      "Reserved premium seats",
      "Child tickets (max 2) — 50% discount",
      "Welcome kit included",
      "Sponsor partner offers",
      "Lounge access during events",
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
      "Full member access to flagship events with reserved premium seating, partner discounts, and exclusive cultural programmes.",
    benefits: [
      "All 4 flagship events — 100% free entry",
      "Partner ticket — 10% discount",
      "Reserved premium seats",
      "Welcome kit included",
      "Sponsor partner offers",
      "Lounge access during events",
    ],
    upgradeTo: "family"
  },
  privileged: {
    id: "privileged",
    name: "Privileged Membership",
    matrixTitle: "Privileged Membership",
    feeMinor: 2500,
    feeLabel: "€25",
    durationYears: 1,
    description:
      "Access member pricing on events, reserved privileged seating, and community updates from Stichting The V.O.I.C.E. NL.",
    benefits: [
      "Flagship events — 10% discount",
      "Reserved privileged seats",
      "Sponsor partner offers",
      "Newsletter and member updates",
    ],
    upgradeTo: "single"
  },
  vownl: {
    id: "vownl",
    name: "VOWNL Membership",
    matrixTitle: "VOWNL Membership",
    feeMinor: 7500,
    feeLabel: "€75",
    durationYears: 1,
    description:
      "Tailored membership for VOWNL participants with event discounts and community access.",
    benefits: [
      "Flagship events — 10% discount",
      "Reserved privileged seats",
      "VOWNL community programmes",
      "Sponsor partner offers",
    ],
    upgradeTo: "single"
  }
};

export const UPGRADE_PLANS = {
  patron: {
    id: "patron",
    title: "Patron Member",
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
    description: "Unlock premium single-member benefits and reserved seating at all flagship events.",
    ctaLabel: "Explore Upgrade",
    href: "/membership#membership-matrix"
  }
};

export function getPlan(planId) {
  if (!planId) return null;
  return MEMBERSHIP_PLANS[String(planId)] || null;
}

export function getUpgradePlan(upgradeId) {
  if (!upgradeId) return UPGRADE_PLANS.patron;
  return UPGRADE_PLANS[String(upgradeId)] || UPGRADE_PLANS.patron;
}
