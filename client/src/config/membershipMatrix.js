/** Shared membership matrix data — keep in sync with MembershipMatrixSection cards. */

export const MATRIX_FEATURE_ROWS = [
  {
    feature: "All 4 Flagship Events In A Year",
    family: "100% Free",
    single: "100% Free",
    privileged: "10% Discount",
    vownl: "10% Discount",
  },
  {
    feature: "Partner Ticket For All 4 Flagship Events",
    family: "100% Free",
    single: "10% Discount",
    privileged: "10% Discount",
    vownl: "10% Discount",
  },
  {
    feature: "Reserved Seats",
    family: "Reserved Premium Seats",
    single: "Reserved Premium Seats",
    privileged: "Reserved Privileged Seats",
    vownl: "Reserved Privileged Seats",
  },
  {
    feature: "Child Ticket (max 2)",
    family: "50% Discount",
    single: "50% Discount",
    privileged: "15% Discount",
    vownl: "15% Discount",
  },
  {
    feature: "Welcome Kit",
    family: "included",
    single: "included",
    privileged: "not-included",
    vownl: "not-included",
  },
  {
    feature: "Sponsors Offers (Partner Benefits)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Lounge Access During Events",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Celebrity Priority Meetup (Invite Only)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
];

export const MATRIX_PLANS = [
  {
    id: "family",
    title: "Premium Family Membership",
    price: "€250",
    featured: false,
    description:
      "Enjoy full access to all flagship events, reserved premium seating for your household, partner tickets, and exclusive member lounge access throughout the year.",
  },
  {
    id: "single",
    title: "Premium Single Membership",
    price: "€150",
    featured: false,
    description:
      "Full member access to flagship events with reserved premium seating, partner discounts, and exclusive cultural programmes.",
  },
  {
    id: "privileged",
    title: "Privileged Membership",
    price: "€25",
    featured: true,
    description:
      "Access member pricing on events, reserved privileged seating, and community updates from Stichting The V.O.I.C.E. NL.",
  },
  {
    id: "vownl",
    title: "VOWNL Membership",
    price: "€25",
    featured: false,
    description:
      "Tailored membership for VOWNL participants with event discounts and community access.",
  },
];

/** Next tier on the public membership page matrix. */
export const MATRIX_UPGRADE_TO = {
  privileged: "single",
  single: "family",
  vownl: "single",
  family: null,
};

export function formatMatrixCell(value) {
  if (value === "included") return "Included";
  if (value === "not-included") return "Not included";
  return value;
}

export function inferPlanIdFromTitle(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("privileged")) return "privileged";
  if (t.includes("premium family") || (t.includes("family") && t.includes("membership"))) return "family";
  if (t.includes("vownl")) return "vownl";
  if (t.includes("single")) return "single";
  return "family";
}

export function getMatrixPlan(planId) {
  if (!planId) return null;
  return MATRIX_PLANS.find((p) => p.id === planId) || null;
}

export function getPlanBenefitsForMatrix(planId) {
  const id = planId || "family";
  return MATRIX_FEATURE_ROWS.map((row) => ({
    id: row.feature,
    feature: row.feature,
    value: row[id],
    label: formatMatrixCell(row[id]),
  }));
}

export function getUpgradeMatrixPlan(currentPlanId) {
  const nextId = MATRIX_UPGRADE_TO[currentPlanId];
  if (!nextId) return null;
  return getMatrixPlan(nextId);
}

/** Upgrade card for dashboard — always returns a display object. */
export function getUpgradeOptionDisplay(currentPlanId, hasMembership) {
  const next = hasMembership
    ? getUpgradeMatrixPlan(currentPlanId)
    : MATRIX_PLANS.find((p) => p.featured) || MATRIX_PLANS[0];

  if (next) {
    return {
      planId: next.id,
      title: next.title,
      price: next.price,
      description: next.description,
      ctaLabel: hasMembership ? "Explore upgrade" : "View membership plans",
      href: "/membership#membership-matrix",
      benefits: getPlanBenefitsForMatrix(next.id),
    };
  }

  const explore = MATRIX_PLANS.find((p) => p.featured) || MATRIX_PLANS[0];
  return {
    planId: explore.id,
    title: explore.title,
    price: explore.price,
    description:
      "You are on our top membership tier. Compare other community plans and benefits on the membership page.",
    ctaLabel: "Explore upgrade",
    href: "/membership#membership-matrix",
    benefits: getPlanBenefitsForMatrix(explore.id),
  };
}
