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

/**
 * Mirrors MembershipBenefitBanner's own render branches so callers can decide
 * whether to show that step at all without duplicating its logic.
 */
export function membershipBannerHasContent(
  detection,
  { memberDiscountApplied = false, discountWarning = "", messages = null } = {}
) {
  if (!detection?.status || detection.status === "GUEST_UNKNOWN") {
    return Boolean(detection?.verificationWarning);
  }

  if (detection.status === "LOGGED_IN_ACTIVE_MEMBER") {
    const hasDiscount = memberDiscountApplied || (detection.discountValue > 0 && !discountWarning);
    return Boolean(discountWarning && !memberDiscountApplied) || hasDiscount;
  }

  if (detection.status === "GUEST_EMAIL_ACTIVE_MEMBER") return true;

  if (
    detection.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
    detection.status === "LOGGED_IN_EXPIRED_MEMBER"
  ) {
    return true;
  }

  if (
    (detection.status === "GUEST_EMAIL_NON_MEMBER" || detection.status === "LOGGED_IN_NON_MEMBER") &&
    messages?.showUpsell
  ) {
    return true;
  }

  return false;
}
