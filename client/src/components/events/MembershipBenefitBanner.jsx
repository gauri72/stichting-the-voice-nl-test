import { Link } from "react-router-dom";
import { IconLogin, IconUserCheck, IconAlertCircle, IconSparkles } from "@tabler/icons-react";

export default function MembershipBenefitBanner({
  detection,
  messages,
  onLogin,
  onContinueWithoutDiscount,
  onAddMembership,
  onTicketsOnly,
  includeMembership,
}) {
  if (!detection?.status || detection.status === "GUEST_UNKNOWN") return null;

  const isActiveGuest =
    detection.status === "GUEST_EMAIL_ACTIVE_MEMBER";
  const isActiveLoggedIn =
    detection.status === "LOGGED_IN_ACTIVE_MEMBER";
  const isExpired =
    detection.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
    detection.status === "LOGGED_IN_EXPIRED_MEMBER";
  const isNonMember =
    detection.status === "GUEST_EMAIL_NON_MEMBER" ||
    detection.status === "LOGGED_IN_NON_MEMBER";

  if (isActiveLoggedIn) {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--active">
        <IconUserCheck size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">Member Discount Applied</p>
          <p className="ticket-booking__member-banner-body">
            Your active {detection.membership?.planName || "membership"} benefits are applied to this booking.
          </p>
        </div>
      </div>
    );
  }

  if (isActiveGuest) {
    return (
      <div className="ticket-booking__member-banner ticket-booking__member-banner--login">
        <IconLogin size={22} />
        <div>
          <p className="ticket-booking__member-banner-title">{messages?.title || "Active membership found"}</p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "You already have an active V.O.I.C.E. NL membership. Please log in to apply your member benefits."}
          </p>
          <div className="ticket-booking__member-banner-actions">
            <Link to="/login" className="ticket-booking__cta ticket-booking__cta--small" onClick={onLogin}>
              Login to Apply Member Discount
            </Link>
            <button
              type="button"
              className="ticket-booking__back"
              onClick={onContinueWithoutDiscount}
            >
              Continue Without Member Discount
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
          <p className="ticket-booking__member-banner-title">{messages?.title || "Membership expired"}</p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "Your V.O.I.C.E. NL membership has expired. Renew your membership with this booking and enjoy member benefits immediately."}
          </p>
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button type="button" className="ticket-booking__cta ticket-booking__cta--small" onClick={onAddMembership}>
                Renew Membership + Buy Tickets
              </button>
              <button type="button" className="ticket-booking__back" onClick={onTicketsOnly}>
                Buy Tickets Only
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
          <p className="ticket-booking__member-banner-title">{messages?.title || "Become a member"}</p>
          <p className="ticket-booking__member-banner-body">
            {messages?.body ||
              "Become a V.O.I.C.E. NL member and unlock exclusive discounts, priority access and member benefits."}
          </p>
          {!includeMembership ? (
            <div className="ticket-booking__member-banner-actions">
              <button type="button" className="ticket-booking__cta ticket-booking__cta--small" onClick={onAddMembership}>
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
