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
};

export function sanitizeCustomerDiscountLabel(label) {
  if (!label) return CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied;

  let cleaned = String(label)
    .replace(/TicketTailor\s*/gi, "")
    .replace(/\bTT\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied;

  return cleaned
    .replace(/^Member Discount Applied$/i, CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied)
    .replace(/^Member Discount \(/i, "Membership Discount (");
}

export function formatMemberDiscountLineLabel(membershipType, discountType, discountValue) {
  const typeLabel = membershipType || "Membership";
  if (discountType === "percentage" && discountValue > 0) {
    return `${typeLabel} — ${discountValue}% discount`;
  }
  if (discountType === "fixed_amount" && discountValue > 0) {
    return `${typeLabel} — €${discountValue} off`;
  }
  return typeLabel;
}
