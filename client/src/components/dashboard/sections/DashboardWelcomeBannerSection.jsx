import { Link } from "react-router-dom";
import { FaCrown, FaIdCard, FaQrcode, FaRegCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { membershipBadgeLabel, scrollToId } from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

export default function DashboardWelcomeBannerSection({
  displayName,
  planShort,
  validUntil,
  hasMembership,
}) {
  const { logout } = useAuth();

  return (
    <header className="dash-welcome" aria-labelledby="dash-welcome-name">
      <div className="dash-welcome__bg" aria-hidden>
        <img
          className="dash-welcome__bg-image dash-welcome__bg-image--light"
          src={breadcrumbBgLight}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
        <img
          className="dash-welcome__bg-image dash-welcome__bg-image--dark"
          src={breadcrumbBgDark}
          alt=""
          decoding="async"
        />
      </div>

      <button type="button" className="dash-welcome__logout" onClick={logout}>
        <FaSignOutAlt aria-hidden />
        <span>Log Out</span>
      </button>

      <div className="dash-welcome__content">
        <p className="dash-welcome__greeting">Welcome Back,</p>
        <h1 id="dash-welcome-name" className="dash-welcome__name dash-grad-text">
          {displayName}
        </h1>

        {hasMembership ? (
          <span className="dash-welcome__badge">
            <FaCrown aria-hidden className="dash-welcome__badge-icon" />
            {membershipBadgeLabel(planShort)}
          </span>
        ) : (
          <Link to="/membership" className="dash-welcome__badge dash-welcome__badge--cta">
            <FaCrown aria-hidden className="dash-welcome__badge-icon" />
            Become a Member
          </Link>
        )}

        <p className="dash-welcome__valid">
          <FaRegCalendarAlt aria-hidden />
          Valid Until: <strong className="dash-grad-text">{validUntil}</strong>
        </p>
      </div>

      <div className="dash-welcome__actions">
        <button
          type="button"
          className="dash-welcome__btn dash-welcome__btn--primary"
          onClick={() => scrollToId("dash-membership-card")}
        >
          <FaQrcode aria-hidden />
          View QR Code
        </button>
        <button
          type="button"
          className="dash-welcome__btn dash-welcome__btn--outline"
          onClick={() => scrollToId("dash-membership-card")}
        >
          <FaIdCard aria-hidden />
          Membership Card
        </button>
      </div>
    </header>
  );
}
