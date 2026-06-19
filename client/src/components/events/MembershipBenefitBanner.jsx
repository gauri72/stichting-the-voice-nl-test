import { useState } from "react";
import { Link } from "react-router-dom";
import { IconLogin, IconUserCheck, IconAlertCircle, IconSparkles, IconUserPlus } from "@tabler/icons-react";
import { buildLoginUrl, buildRegisterUrl } from "../../utils/authRedirect.js";

function formatSource(source) {
  if (source === "BOTH") return "Local + TicketTailor";
  if (source === "TICKETTAILOR") return "TicketTailor";
  if (source === "LOCAL") return "Local";
  return "";
}

export default function MembershipBenefitBanner({
  detection,
  messages,
  onLogin,
  onSaveBeforeLogin,
  onContinueWithoutDiscount,
  onAddMembership,
  onTicketsOnly,
  includeMembership,
  returnPath,
}) {
  const [loginSaving, setLoginSaving] = useState(false);

  if (!detection?.status || detection.status === "GUEST_UNKNOWN") {
    if (detection?.verificationWarning) {
      return (
        <div className="ticket-booking__member-banner ticket-booking__member-banner--warning">
          <IconAlertCircle size={22} />
          <p className="ticket-booking__member-banner-body">{detection.verificationWarning}</p>
        </div>
      );
    }
    return null;
  }

  const membershipType =
    detection.membershipType || detection.membership?.planName || "Membership";
  const memberUntil =
    detection.memberUntil || detection.membership?.memberUntilFormatted || "";
  const sourceLabel = formatSource(detection.source);

  const isActiveGuest = detection.status === "GUEST_EMAIL_ACTIVE_MEMBER";
  const isActiveLoggedIn = detection.status === "LOGGED_IN_ACTIVE_MEMBER";
  const isExpired =
    detection.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
    detection.status === "LOGGED_IN_EXPIRED_MEMBER";
  const isNonMember =
    detection.status === "GUEST_EMAIL_NON_MEMBER" ||
    detection.status === "LOGGED_IN_NON_MEMBER";

  async function handleLoginClick(event) {
    event.preventDefault();
    onLogin?.();
    setLoginSaving(true);
    try {
      let targetPath = returnPath || "/dashboard";
      if (onSaveBeforeLogin) {
        const saved = await onSaveBeforeLogin();
        if (saved?.returnPath) targetPath = saved.returnPath;
      }
      window.location.href = buildLoginUrl(targetPath);
    } catch {
      window.location.href = buildLoginUrl(returnPath || "/dashboard");
    } finally {
      setLoginSaving(false);
    }
  }

  if (isActiveLoggedIn) {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
        <IconUserCheck size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">Member Discount Applied</p>
          <p className="ticket-booking__member-banner-body">
            Your active {membershipType} benefits are applied to this booking.
            {memberUntil ? ` Valid until ${memberUntil}.` : ""}
            {sourceLabel ? ` Source: ${sourceLabel}.` : ""}
          </p>
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
            {messages?.title || "Active Membership Found"}
          </p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "We found an active V.O.I.C.E. NL membership associated with this email."}
          </p>
          <ul className="ticket-booking__member-details">
            <li>
              <strong>Membership:</strong> {membershipType}
            </li>
            {memberUntil ? (
              <li>
                <strong>Valid until:</strong> {memberUntil}
              </li>
            ) : null}
            {sourceLabel ? (
              <li>
                <strong>Source:</strong> {sourceLabel}
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
                disabled={loginSaving}
              >
                <IconLogin size={16} />
                {loginSaving ? "Saving checkout…" : "Login & Apply Benefits"}
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
              {sourceLabel ? ` · Source: ${sourceLabel}` : ""}
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
