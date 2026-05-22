/** Shared membership matrix data — keep in sync with MembershipMatrixSection cards. */

export const MATRIX_FEATURE_ROWS = [
  {
    feature: "Discount on all events within the validity period",
    family: "100% Free",
    single: "100% Free",
    privilegedFamily: "10% Discount",
    privilegedSingle: "10% Discount",
  },
  {
    feature: "Reserved Seats",
    family: "Reserved Premium Seats",
    single: "Reserved Premium Seats",
    privilegedFamily: "Reserved Privileged Seats",
    privilegedSingle: "Reserved Privileged Seats",
  },
  {
    feature: "Child Ticket (max 2)",
    family: "50% Discount",
    single: "not-included",
    privilegedFamily: "15% Discount",
    privilegedSingle: "not-included",
  },
  {
    feature: "Welcome Kit",
    family: "included",
    single: "included",
    privilegedFamily: "not-included",
    privilegedSingle: "not-included",
  },
  {
    feature: "Sponsors Offers (Partner Benefits)",
    family: "included",
    single: "included",
    privilegedFamily: "included",
    privilegedSingle: "included",
  },
  {
    feature: "Lounge Access During Events",
    family: "included",
    single: "included",
    privilegedFamily: "included",
    privilegedSingle: "included",
  },
  {
    feature: "VOWNL Women-Specific Events Discount",
    family: "Free",
    single: "Free",
    privilegedFamily: "10% Discount",
    privilegedSingle: "10% Discount",
  },
  {
    feature: "Celebrity Priority Meetup (Invite Only)",
    family: "included",
    single: "included",
    privilegedFamily: "not-included",
    privilegedSingle: "not-included",
  },
];

export const MATRIX_PLANS = [
  {
    id: "family",
    title: "Premium Family Membership",
    price: "€250",
    featured: false,
    description:
      "Premium household membership with free entry to events within your validity period, reserved premium seating, lounge access, and VOWNL women-specific events at no extra cost.",
  },
  {
    id: "single",
    title: "Premium Single Membership",
    price: "€150",
    featured: false,
    description:
      "Premium individual membership with free entry to events within your validity period, reserved premium seating, lounge access, and VOWNL women-specific events at no extra cost.",
  },
  {
    id: "privilegedFamily",
    title: "Privileged Family Membership",
    price: "€45",
    featured: true,
    description:
      "Affordable family membership with event discounts, reserved privileged seating, and member benefits from Stichting The V.O.I.C.E. NL.",
  },
  {
    id: "privilegedSingle",
    title: "Privileged Single Membership",
    price: "€30",
    featured: false,
    description:
      "Affordable individual membership with event discounts, reserved privileged seating, and community updates from Stichting The V.O.I.C.E. NL.",
  },
];

/** Map legacy plan ids from Ticket Tailor / older records to current matrix ids. */
export const LEGACY_PLAN_IDS = {
  privileged: "privilegedFamily",
  vownl: "privilegedSingle",
};

export function normalizeMatrixPlanId(planId) {
  if (!planId) return "family";
  const id = String(planId);
  return LEGACY_PLAN_IDS[id] || id;
}

/** Next tier on the public membership page matrix. */
export const MATRIX_UPGRADE_TO = {
  privilegedSingle: "privilegedFamily",
  privilegedFamily: "single",
  single: "family",
  family: null,
};

export function formatMatrixCell(value) {
  if (value === "included") return "Included";
  if (value === "not-included") return "Not included";
  return value;
}

export function inferPlanIdFromTitle(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("privileged") && t.includes("family")) return "privilegedFamily";
  if (t.includes("privileged") && t.includes("single")) return "privilegedSingle";
  if (t.includes("privileged")) return "privilegedFamily";
  if (t.includes("premium family") || (t.includes("family") && t.includes("membership"))) return "family";
  if (t.includes("premium single") || (t.includes("single") && t.includes("membership"))) return "single";
  if (t.includes("vownl")) return "privilegedSingle";
  if (t.includes("single")) return "single";
  return "family";
}

export function getMatrixPlan(planId) {
  if (!planId) return null;
  const id = normalizeMatrixPlanId(planId);
  return MATRIX_PLANS.find((p) => p.id === id) || null;
}

export function getPlanBenefitsForMatrix(planId) {
  const id = normalizeMatrixPlanId(planId);
  return MATRIX_FEATURE_ROWS.map((row) => ({
    id: row.feature,
    feature: row.feature,
    value: row[id],
    label: formatMatrixCell(row[id]),
  }));
}

export function getUpgradeMatrixPlan(currentPlanId) {
  const nextId = MATRIX_UPGRADE_TO[normalizeMatrixPlanId(currentPlanId)];
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
