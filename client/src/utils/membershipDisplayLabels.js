/**
 * Customer-facing membership copy. Never expose internal provider names.
 * These are plain JS helpers (no hooks), so callers must pass the `t`
 * function from their own useTranslation(["checkout"]) call.
 */

const FALLBACK_MESSAGES_EN = {
  activeFound: "Active Membership Found",
  activeDetected: "Active Membership Detected",
  discountApplied: "Membership Discount Applied",
  benefitApplied: "Membership Benefit Applied",
  premiumBenefitApplied: "Premium Membership Benefit Applied",
  verified: "Membership Verified",
  validated: "Membership Validated",
};

// Kept for any caller that hasn't been migrated to pass `t` yet — English-only.
export const CUSTOMER_MEMBERSHIP_MESSAGES = FALLBACK_MESSAGES_EN;

export function getMembershipMessages(t) {
  if (!t) return FALLBACK_MESSAGES_EN;
  return {
    activeFound: t("checkout:membershipMessages.activeFound"),
    activeDetected: t("checkout:membershipMessages.activeDetected"),
    discountApplied: t("checkout:membershipMessages.discountApplied"),
    benefitApplied: t("checkout:membershipMessages.benefitApplied"),
    premiumBenefitApplied: t("checkout:membershipMessages.premiumBenefitApplied"),
    verified: t("checkout:membershipMessages.verified"),
    validated: t("checkout:membershipMessages.validated"),
  };
}

export function sanitizeCustomerDiscountLabel(label, t) {
  const messages = getMembershipMessages(t);
  if (!label) return messages.discountApplied;

  let cleaned = String(label)
    .replace(/TicketTailor\s*/gi, "")
    .replace(/\bTT\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return messages.discountApplied;

  return cleaned
    .replace(/^Member Discount Applied$/i, messages.discountApplied)
    .replace(/^Member Discount \(/i, "Membership Discount (");
}

export function formatMemberDiscountLineLabel(membershipType, discountType, discountValue, t) {
  const typeLabel = membershipType || (t ? t("checkout:membershipMessages.defaultType") : "Membership");
  if (discountType === "percentage" && discountValue > 0) {
    return t
      ? t("checkout:membershipMessages.discountLinePercentage", { type: typeLabel, value: discountValue })
      : `${typeLabel} — ${discountValue}% discount`;
  }
  if (discountType === "fixed_amount" && discountValue > 0) {
    return t
      ? t("checkout:membershipMessages.discountLineFixed", { type: typeLabel, value: discountValue })
      : `${typeLabel} — €${discountValue} off`;
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
