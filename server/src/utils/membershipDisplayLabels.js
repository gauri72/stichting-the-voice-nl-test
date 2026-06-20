/**
 * Customer-facing membership copy. Never expose internal provider names.
 */

export const CUSTOMER_MEMBERSHIP_MESSAGES = {
  activeFound: "Active Membership Found",
  activeDetected: "Active Membership Detected",
  discountApplied: "Membership Discount Applied",
  benefitApplied: "Membership Benefit Applied",
  premiumBenefitApplied: "Premium Membership Benefit Applied",
  verified: "Membership Verified",
  validated: "Membership Validated",
  memberBenefitsAvailable: "Member benefits available",
};

export function isPremiumMembershipType(membershipType = "") {
  const t = String(membershipType).toLowerCase();
  return t.includes("premium");
}

export function formatMembershipDiscountLabel(membershipType, discountRule = {}) {
  const typeLabel = membershipType || "Membership";
  const { discountType, discountValue } = discountRule;

  if (
    discountType === "free_ticket" ||
    (discountType === "percentage" && Number(discountValue) >= 100)
  ) {
    return isPremiumMembershipType(typeLabel)
      ? CUSTOMER_MEMBERSHIP_MESSAGES.premiumBenefitApplied
      : CUSTOMER_MEMBERSHIP_MESSAGES.benefitApplied;
  }

  if (discountType === "percentage" && discountValue > 0) {
    return `Membership Discount (${typeLabel} — ${discountValue}%)`;
  }

  if (discountType === "fixed_amount" && discountValue > 0) {
    return `Membership Discount (${typeLabel} — €${Number(discountValue).toFixed(2)} off)`;
  }

  return CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied;
}

export function sanitizeCustomerDiscountLabel(label) {
  if (!label) return CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied;

  let cleaned = String(label)
    .replace(/TicketTailor\s*/gi, "")
    .replace(/\bTT\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied;

  // Normalize common legacy labels
  cleaned = cleaned
    .replace(/^Member Discount Applied$/i, CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied)
    .replace(/^Member Discount \(/i, "Membership Discount (");

  return cleaned;
}

export function buildActiveMembershipFoundBody({ membershipLabel, validUntil, requiresAccountLinking }) {
  if (requiresAccountLinking) {
    return `We found an active V.O.I.C.E. NL ${membershipLabel} membership linked to this email (valid until ${validUntil}). Create an account to link it and apply benefits.`;
  }
  return `We found an active V.O.I.C.E. NL membership associated with this email. Membership: ${membershipLabel}. Valid until: ${validUntil}.`;
}

export function buildActiveMembershipAppliedBody({ membershipLabel, validUntil }) {
  const until = validUntil ? ` Valid until ${validUntil}.` : "";
  return `Your active ${membershipLabel} membership discount is applied to this booking.${until}`;
}
