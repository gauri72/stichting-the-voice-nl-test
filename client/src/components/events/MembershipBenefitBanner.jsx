import { Link } from "react-router-dom";
import { IconLogin, IconUserCheck, IconAlertCircle, IconSparkles, IconUserPlus } from "@tabler/icons-react";
import { buildRegisterUrl } from "../../utils/authRedirect.js";
import {
  CUSTOMER_MEMBERSHIP_MESSAGES,
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
    detection.membershipType || detection.membership?.planName || "Membership";
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
              {CUSTOMER_MEMBERSHIP_MESSAGES.activeFound}
            </p>
            <p className="ticket-booking__member-banner-body">{discountWarning}</p>
          </div>
        </div>
      );
    }

    if (!hasDiscount) return null;

    const discountTitle = sanitizeCustomerDiscountLabel(
      memberDiscountLabel || CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied
    );

    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
        <IconUserCheck size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">{discountTitle}</p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              `Your active ${membershipType} membership discount is applied to this booking.`}
            {memberUntil ? ` Valid until ${memberUntil}.` : ""}
          </p>
          {detection.discountValue > 0 ? (
            <p className="ticket-booking__member-detail-line">
              {formatMemberDiscountLineLabel(
                membershipType,
                detection.discountType,
                detection.discountValue
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

    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--login">
        <IconLogin size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">
            {messages?.title || CUSTOMER_MEMBERSHIP_MESSAGES.activeDetected}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "We found an active V.O.I.C.E. NL membership associated with this email."}
          </p>
          <ul className="ticket-booking__member-details">
            <li>
              <strong>Membership Type:</strong> {membershipType}
            </li>
            {memberUntil ? (
              <li>
                <strong>Valid Until:</strong> {memberUntil}
              </li>
            ) : null}
          </ul>
          <div className="ticket-booking__member-banner-actions">
            {detection.requiresAccountLinking ? (
              <Link
                to={registerHref}
                className="ticket-booking__cta ticket-booking__cta--small"
              >
                <IconUserPlus size={16} /> Create Account &amp; Apply Benefits
              </Link>
            ) : (
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={handleLoginClick}
              >
                <IconLogin size={16} />
                Login &amp; Apply Benefits
              </button>
            )}
            <button
              type="button"
              className="ticket-booking__back"
              onClick={onContinueWithoutDiscount}
            >
              Continue Without Benefits
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
            {messages?.title || "Membership Expired"}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "Your V.O.I.C.E. NL membership has expired. Renew your membership with this booking and enjoy member benefits immediately."}
          </p>
          {memberUntil ? (
            <p className="ticket-booking__member-detail-line">
              Expired on: <strong>{memberUntil}</strong>
            </p>
          ) : null}
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={onAddMembership}
              >
                Renew Membership + Tickets
              </button>
              <button type="button" className="ticket-booking__back" onClick={onTicketsOnly}>
                Tickets Only
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
            {messages?.title || "Become a member"}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "Become a V.O.I.C.E. NL member and unlock exclusive discounts, priority access and member benefits."}
          </p>
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                onClick={onAddMembership}
              >
                Add Membership + Buy Tickets
              </button>
              <button type="button" className="ticket-booking__back" onClick={onTicketsOnly}>
                Continue With Tickets Only
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
