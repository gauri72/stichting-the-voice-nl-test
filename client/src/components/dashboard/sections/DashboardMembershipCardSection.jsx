import {
  IconBolt,
  IconCrown,
  IconHeartHandshake,
  IconRosetteDiscount,
  IconShoppingBag,
  IconSofa,
  IconTicket,
} from "@tabler/icons-react";
import membershipLogo from "../../../assets/Dashboard/logo.png";
import {
  DASHBOARD_MEMBER_PROFILE_ID,
  DASHBOARD_MEMBERSHIP_CARD_ID,
  PREMIUM_BENEFITS,
  splitMembershipIdDisplay,
} from "../dashboardUtils.js";
import "../../../styles/dashboard-membership-card-section.css";

const BENEFIT_CONFIG = {
  entry: { Icon: IconTicket, lines: ["Free Event", "Entry"] },
  seats: { Icon: IconSofa, lines: ["Reserved Premium", "Seats"] },
  lounge: { Icon: IconCrown, lines: ["VIP Lounge", "Access"] },
  artist: { Icon: IconHeartHandshake, lines: ["Artist Meet", "& Greet"] },
  partner: { Icon: IconRosetteDiscount, lines: ["Partner", "Discounts"] },
  merch: { Icon: IconShoppingBag, lines: ["Merchandise", "Discounts"] },
  priority: { Icon: IconBolt, lines: ["Priority", "Registration"] },
};

function TwoLineLabel({ lines }) {
  return (
    <span className="dash-membership__benefit-label">
      <span>{lines[0]}</span>
      <span>{lines[1]}</span>
    </span>
  );
}

function MembershipBg() {
  return (
    <div className="dash-membership__bg" aria-hidden>
      <div className="dash-membership__bg-logo-wrap">
        <img
          className="dash-membership__bg-logo logo-glow"
          src={membershipLogo}
          alt=""
          decoding="async"
        />
      </div>
    </div>
  );
}

export default function DashboardMembershipCardSection({
  displayName,
  planShort,
  membershipId,
  memberSince,
  validUntil,
  hasMembership,
  qrSrc,
}) {
  const { primary: membershipIdPrimary, secondary: membershipIdSecondary } =
    splitMembershipIdDisplay(membershipId);

  return (
    <div className="dash-membership-group">
      <section
        className="dash-membership__rect dash-membership__rect--top"
        id={DASHBOARD_MEMBERSHIP_CARD_ID}
        aria-labelledby="dash-membership-title"
      >
        <MembershipBg />
        <div className="dash-membership__rect-body">
          <p className="dash-membership__eyebrow dash-membership__eyebrow--membership">
            <span className="dash-membership__eyebrow-line" aria-hidden />
            Your Membership
            <span className="dash-membership__eyebrow-line" aria-hidden />
          </p>
          <div className="dash-membership__card">
            <div className="dash-membership__info" id={DASHBOARD_MEMBER_PROFILE_ID}>
              <h2 className="dash-membership__plan" id="dash-membership-title">
                {hasMembership ? planShort : "No Active Membership"}
              </h2>
              <p className="dash-membership__member">{displayName}</p>
              <p className="dash-membership__id-label">Membership ID</p>
              <p className="dash-membership__id-value dash-grad-text">
                <span className="dash-membership__id-line">{membershipIdPrimary}</span>
                {membershipIdSecondary ? (
                  <span className="dash-membership__id-line">{membershipIdSecondary}</span>
                ) : null}
              </p>
              <div className="dash-membership__dates">
                <div className="dash-membership__date">
                  <small>Member Since</small>
                  <strong>{memberSince}</strong>
                </div>
                <span className="dash-membership__date-divider" aria-hidden />
                <div className="dash-membership__date">
                  <small>Valid Until</small>
                  <strong>{validUntil}</strong>
                </div>
              </div>
            </div>
            <div className="dash-membership__logo-col" aria-hidden>
              <img
                className="dash-membership__card-logo logo-glow"
                src={membershipLogo}
                alt=""
                decoding="async"
              />
            </div>
            <div className="dash-membership__qr">
              <div className="dash-membership__qr-code">
                <img src={qrSrc} alt={`Membership QR code for ${membershipId}`} loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-membership__rect dash-membership__rect--bottom" aria-label="Your Premium Benefits">
        <div className="dash-membership__rect-body">
          <p className="dash-membership__eyebrow dash-membership__eyebrow--benefits">
            <span className="dash-membership__eyebrow-line" aria-hidden />
            <span className="dash-membership__benefits-title dash-grad-text">Your Premium Benefits</span>
            <span className="dash-membership__eyebrow-line" aria-hidden />
          </p>
          <ul className="dash-membership__benefits-list">
            {PREMIUM_BENEFITS.map((benefit) => {
              const config = BENEFIT_CONFIG[benefit.id];
              const Icon = config?.Icon;
              return (
                <li key={benefit.id}>
                  <span className="dash-membership__benefit-icon" aria-hidden>
                    {Icon ? <Icon size={32} stroke={1.65} /> : null}
                  </span>
                  <TwoLineLabel lines={config?.lines || [benefit.label, ""]} />
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
