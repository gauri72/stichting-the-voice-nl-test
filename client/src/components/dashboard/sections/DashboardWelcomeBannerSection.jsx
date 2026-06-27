import { Link, useNavigate } from "react-router-dom";
import { FaIdCard, FaSignOutAlt } from "react-icons/fa";
import { AiAgent, PayWallet } from "../../icons/icons/index.js";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

export default function DashboardWelcomeBannerSection({ displayName, greeting = "Welcome,", title }) {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const { openAssistant } = useAiAssistant();
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
        <p className="dash-welcome__greeting">{greeting}</p>
        <h1
          id="dash-welcome-name"
          className={`dash-welcome__name${isDark ? "" : " dash-grad-text"}`}
        >
          {displayName}
        </h1>
        <button type="button" onClick={openAssistant} className="dash-welcome__ai-cta">
          <span className="dash-welcome__ai-cta-icon">
            <AiAgent width={20} height={20} aria-hidden="true" />
          </span>
          <span className="dash-welcome__ai-cta-text">
            <span className="dash-welcome__ai-cta-title">V.Assist</span>
            <span className="dash-welcome__ai-cta-subtitle">V.O.I.C.E. AI Assist - Your Smart Companion For Everything</span>
          </span>
        </button>
      </div>

      <div className="dash-welcome__bottom-panel">
        <div className="dash-welcome__account-actions">
          <Link to="/dashboard/wallet" className="dash-welcome__badge dash-welcome__btn--wallet" aria-label="V.Wallet">
            <PayWallet width={16} height={16} aria-hidden="true" className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">V.Wallet</span>
          </Link>
          <Link to={DASHBOARD_ROUTES.profile} className="dash-welcome__badge dash-welcome__btn--profile" aria-label="My Profile">
            <FaIdCard aria-hidden className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">My Profile</span>
          </Link>
          <button
            type="button"
            className="dash-welcome__badge dash-welcome__btn--logout"
            onClick={handleLogout}
            aria-label="Log Out"
          >
            <FaSignOutAlt aria-hidden className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
