import { Link, useNavigate } from "react-router-dom";
import { FaIdCard, FaSignOutAlt } from "react-icons/fa";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

export default function DashboardWelcomeBannerSection({ displayName }) {
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
      </div>

      <div className="dash-welcome__top-actions">
        <Link to={DASHBOARD_ROUTES.profile} className="dash-welcome__badge dash-welcome__btn--profile">
          <FaIdCard aria-hidden className="dash-welcome__badge-icon" />
          My Profile
        </Link>
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
