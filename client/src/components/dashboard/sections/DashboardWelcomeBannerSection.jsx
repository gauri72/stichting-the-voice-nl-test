import { Link, useNavigate } from "react-router-dom";
import { FaCrown, FaIdCard, FaQrcode, FaSignOutAlt } from "react-icons/fa";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import {
  DASHBOARD_MEMBERSHIP_CARD_ID,
  DASHBOARD_ROUTES,
  membershipBadgeLabel,
  scrollToId,
} from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

function welcomeBadgeLabel(planShort) {
  return membershipBadgeLabel(planShort).replace(/membership/gi, "Member");
}

export default function DashboardWelcomeBannerSection({
  displayName,
  planShort,
  hasMembership,
}) {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/my-account", { replace: true });
  }

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

      <div className="dash-welcome__content">
        <p className="dash-welcome__greeting">Welcome,</p>
        <h1
          id="dash-welcome-name"
          className={`dash-welcome__name${isDark ? "" : " dash-grad-text"}`}
        >
          {displayName}
        </h1>

        {hasMembership ? (
          <span className="dash-welcome__badge">
            <FaCrown aria-hidden className="dash-welcome__badge-icon" />
            {welcomeBadgeLabel(planShort)}
          </span>
        ) : (
          <Link to={DASHBOARD_ROUTES.membership} className="dash-welcome__badge dash-welcome__badge--cta">
            <FaCrown aria-hidden className="dash-welcome__badge-icon" />
            Become a Member
          </Link>
        )}

      </div>

      <div className="dash-welcome__top-actions">
        <Link to={DASHBOARD_ROUTES.profile} className="dash-welcome__badge dash-welcome__btn--profile">
          <FaIdCard aria-hidden className="dash-welcome__badge-icon" />
          My Profile
        </Link>
        <button
          type="button"
          className="dash-welcome__badge dash-welcome__btn--corner"
          onClick={() => scrollToId(DASHBOARD_MEMBERSHIP_CARD_ID)}
        >
          <FaQrcode aria-hidden className="dash-welcome__badge-icon" />
          View Membership
        </button>
        <button
          type="button"
          className="dash-welcome__badge dash-welcome__btn--logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt aria-hidden className="dash-welcome__badge-icon" />
          Log Out
        </button>
      </div>
    </header>
  );
}
