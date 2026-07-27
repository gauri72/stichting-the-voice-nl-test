import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconLogin, IconUserCheck, IconAlertCircle, IconSparkles, IconUserPlus } from "@tabler/icons-react";
import { buildRegisterUrl } from "../../utils/authRedirect.js";
import {
  getMembershipMessages,
  formatMemberDiscountLineLabel,
  membershipBannerHasContent,
  sanitizeCustomerDiscountLabel,
} from "../../utils/membershipDisplayLabels.js";

export default function MembershipBenefitBanner({
  detection,
  messages,
  onRequestLogin,
  onContinueWithoutDiscount,
  onAddMembership,
  onTicketsOnly,
  includeMembership,
  returnPath,
  memberDiscountApplied = false,
  discountWarning = "",
  memberDiscountLabel = "",
}) {
  const { t } = useTranslation(["checkout"]);
  const messagesCopy = getMembershipMessages(t);

  if (!membershipBannerHasContent(detection, { memberDiscountApplied, discountWarning, messages })) {
    return null;
  }

  if (!detection?.status || detection.status === "GUEST_UNKNOWN") {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--warning">
        <IconAlertCircle size={22} />
        <p className="ticket-booking__member-banner-body">{detection.verificationWarning}</p>
      </div>
    );
  }

  const membershipType =
    detection.membershipType || detection.membership?.planName || t("checkout:membershipMessages.defaultType");
  const memberUntil =
    detection.memberUntil || detection.membership?.memberUntilFormatted || "";

  const isActiveGuest = detection.status === "GUEST_EMAIL_ACTIVE_MEMBER";
  const isActiveLoggedIn = detection.status === "LOGGED_IN_ACTIVE_MEMBER";
  const isExpired =
    detection.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
    detection.status === "LOGGED_IN_EXPIRED_MEMBER";
  const isNonMember =
    detection.status === "GUEST_EMAIL_NON_MEMBER" ||
    detection.status === "LOGGED_IN_NON_MEMBER";

  function handleLoginClick(event) {
    event.preventDefault();
    onRequestLogin?.();
  }

  if (isActiveLoggedIn) {
    const hasDiscount = memberDiscountApplied || (detection.discountValue > 0 && !discountWarning);

    if (discountWarning && !memberDiscountApplied) {
      return (
        <div className="ticket-booking__member-banner ticket-booking__member-banner--warning">
          <IconAlertCircle size={22} />
          <div>
            <p className="ticket-booking__member-banner-title">
              {messagesCopy.activeFound}
            </p>
            <p className="ticket-booking__member-banner-body">{discountWarning}</p>
          </div>
        </div>
      );
    }

    if (!hasDiscount) return null;

    const discountTitle = sanitizeCustomerDiscountLabel(
      memberDiscountLabel || messagesCopy.discountApplied,
      t
    );

    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
        <IconUserCheck size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">{discountTitle}</p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              t("checkout:membershipBanner.activeFoundBody", { type: membershipType })}
            {memberUntil ? ` ${t("checkout:membershipBanner.validUntilSuffix", { date: memberUntil })}` : ""}
          </p>
          {detection.discountValue > 0 ? (
            <p className="ticket-booking__member-detail-line">
              {formatMemberDiscountLineLabel(
                membershipType,
                detection.discountType,
                detection.discountValue,
                t
              )}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (isActiveGuest) {
    const memberEmail = detection.membership?.email || "";
    const registerHref = buildRegisterUrl(memberEmail, returnPath || "/dashboard");

    // Membership discount cap fully used up (by this email, for this event, across any
    // past order) — logging in wouldn't unlock more, since the cap applies identically
    // whether or not the customer is logged in. Nothing to opt into or out of here.
    if (detection.discountCapReached) {
      return (
        <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
          <IconUserCheck size={22} />
          <div>
            <p className="ticket-booking__member-banner-title">{messagesCopy.activeDetected}</p>
            <p className="ticket-booking__member-banner-body">
              {t("checkout:membershipBanner.discountCapReachedBody", { type: membershipType })}
            </p>
          </div>
        </div>
      );
    }

    // Redeemable without logging in (the discount cap feature is on and this email is
    // still under it) — treat exactly like an already-logged-in member: show what
    // happened, no login CTA, since logging in wouldn't apply a bigger discount.
    if (!detection.requiresLogin) {
      const hasDiscount = memberDiscountApplied || (detection.discountValue > 0 && !discountWarning);

      if (discountWarning && !memberDiscountApplied) {
        return (
          <div className="ticket-booking__member-banner ticket-booking__member-banner--warning">
            <IconAlertCircle size={22} />
            <div>
              <p className="ticket-booking__member-banner-title">{messagesCopy.activeFound}</p>
              <p className="ticket-booking__member-banner-body">{discountWarning}</p>
            </div>
          </div>
        );
      }

      if (!hasDiscount) return null;

      const discountTitle = sanitizeCustomerDiscountLabel(
        memberDiscountLabel || messagesCopy.discountApplied,
        t
      );

      return (
        <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
          <IconUserCheck size={22} />
          <div>
            <p className="ticket-booking__member-banner-title">{discountTitle}</p>
            <p className="ticket-booking__member-banner-body">
              {messages?.body ||
                t("checkout:membershipBanner.activeFoundBody", { type: membershipType })}
              {memberUntil ? ` ${t("checkout:membershipBanner.validUntilSuffix", { date: memberUntil })}` : ""}
            </p>
            {detection.discountValue > 0 ? (
              <p className="ticket-booking__member-detail-line">
                {formatMemberDiscountLineLabel(
                  membershipType,
                  detection.discountType,
                  detection.discountValue,
                  t
                )}
              </p>
            ) : null}
            {detection.requiresAccountLinking ? (
              <div className="ticket-booking__member-banner-actions">
                <Link
                  to={registerHref}
                  className="ticket-booking__cta ticket-booking__cta--small"
                >
                  <IconUserPlus size={16} /> {t("checkout:membershipBanner.createAccountApply")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    // Legacy path — the discount cap feature is toggled off (or a TicketTailor-specific
    // setting still requires it): same login-gate UI as before the cap feature existed.
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--login">
        <IconLogin size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">
            {messages?.title || messagesCopy.activeDetected}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body || t("checkout:membershipBanner.guestActiveBody")}
          </p>
          <ul className="ticket-booking__member-details">
            <li>
              <strong>{t("checkout:membershipBanner.membershipType")}:</strong> {membershipType}
            </li>
            {memberUntil ? (
              <li>
                <strong>{t("checkout:membershipBanner.validUntil")}:</strong> {memberUntil}
              </li>
            ) : null}
          </ul>
          <div className="ticket-booking__member-banner-actions">
            {detection.requiresAccountLinking ? (
              <Link
                to={registerHref}
                className="ticket-booking__cta ticket-booking__cta--small"
              >
                <IconUserPlus size={16} /> {t("checkout:membershipBanner.createAccountApply")}
              </Link>
            ) : (
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={handleLoginClick}
              >
                <IconLogin size={16} />
                {t("checkout:membershipBanner.loginApply")}
              </button>
            )}
            <button
              type="button"
              className="ticket-booking__back"
              onClick={onContinueWithoutDiscount}
            >
              {t("checkout:membershipBanner.continueWithoutBenefits")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--expired">
        <IconAlertCircle size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">
            {messages?.title || t("checkout:membershipBanner.membershipExpiredTitle")}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body || t("checkout:membershipBanner.membershipExpiredBody")}
          </p>
          {memberUntil ? (
            <p className="ticket-booking__member-detail-line">
              {t("checkout:membershipBanner.expiredOn")}: <strong>{memberUntil}</strong>
            </p>
          ) : null}
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={onAddMembership}
              >
                {t("checkout:membershipBanner.renewPlusTickets")}
              </button>
              <button type="button" className="ticket-booking__back" onClick={onTicketsOnly}>
                {t("checkout:membershipBanner.ticketsOnly")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (isNonMember && messages?.showUpsell) {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--upsell">
        <IconSparkles size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">
            {messages?.title || t("checkout:membershipBanner.becomeMemberTitle")}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body || t("checkout:membershipBanner.becomeMemberBody")}
          </p>
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={onAddMembership}
              >
                {t("checkout:membershipBanner.addMembershipPlusTickets")}
              </button>
              <button type="button" className="ticket-booking__back" onClick={onTicketsOnly}>
                {t("checkout:membershipBanner.continueTicketsOnly")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
