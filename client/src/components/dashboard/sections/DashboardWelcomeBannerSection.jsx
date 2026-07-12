import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaIdCard, FaSignOutAlt } from "react-icons/fa";
import { IconSparkles, IconCopy, IconCheck } from "@tabler/icons-react";
import { PayWallet } from "../../icons/icons/index.js";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

export default function DashboardWelcomeBannerSection({
  displayName,
  greeting = "Welcome,",
  title,
  membershipId,
  hasMembership,
}) {
  const { isDark } = useTheme();
  const { logout } = useAuth();
  const { openAssistant } = useAiAssistant();
  const { wallet: walletData, loadWallet } = useWallet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [aiTooltipVisible, setAiTooltipVisible] = useState(false);
  const aiTooltipId = useId();

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  function showAiTooltip() {
    setAiTooltipVisible(true);
  }
  function hideAiTooltip() {
    setAiTooltipVisible(false);
  }

  function handleLogout() {
    logout();
    navigate("/my-account", { replace: true });
  }

  async function handleCopyMembershipId() {
    try {
      await navigator.clipboard.writeText(membershipId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the code is still visible to select/copy manually.
    }
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
        <div className="dash-welcome__chips-row">
          {hasMembership && membershipId ? (
            <button
              type="button"
              className="dash-welcome__membership-code"
              onClick={handleCopyMembershipId}
              aria-label={`Copy membership code ${membershipId}`}
            >
              <span className="dash-welcome__membership-code-label">Membership code</span>
              <span className="dash-welcome__membership-code-row">
                <span className="dash-welcome__membership-code-value">{membershipId}</span>
                {copied ? (
                  <IconCheck size={20} aria-hidden="true" className="dash-welcome__membership-code-icon dash-welcome__membership-code-icon--copied" />
                ) : (
                  <IconCopy size={20} aria-hidden="true" className="dash-welcome__membership-code-icon" />
                )}
              </span>
            </button>
          ) : null}
        </div>
        <div className="dash-welcome__ai-cta-wrap">
          <button
            type="button"
            onClick={openAssistant}
            onMouseEnter={showAiTooltip}
            onMouseLeave={hideAiTooltip}
            onFocus={showAiTooltip}
            onBlur={hideAiTooltip}
            className="dash-welcome__ai-cta"
            aria-label="Open V.Assist"
            aria-describedby={aiTooltipId}
          >
            <IconSparkles size={16} aria-hidden="true" className="dash-welcome__ai-cta-icon" />
            <span className="dash-welcome__ai-cta-label">V.Assist</span>
          </button>
          {aiTooltipVisible ? (
            <div id={aiTooltipId} role="tooltip" className="dash-welcome__ai-tooltip">
              <p>Your Smart AI companion For Everything.</p>
              <p>Book tickets, manage memberships, explore benefits and take action — all through conversation.</p>
              <p>Ask. Explore. Experience..</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="dash-welcome__bottom-panel">
        <div className="dash-welcome__account-actions">
          <Link to="/dashboard/wallet" className="dash-welcome__badge dash-welcome__btn--wallet" aria-label="V.Wallet">
            <PayWallet width="1em" height="1em" aria-hidden="true" className="dash-welcome__badge-icon" />
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
        {walletData?.enabled ? (
          <Link to="/dashboard/wallet" className="dash-welcome__points-chip" aria-label={`${walletData.rewardPoints ?? 0} points — redeem in V.Wallet`}>
            <span className="dash-welcome__points-chip-label">Redeem Points</span>
            <span className="dash-welcome__points-chip-value">{walletData.rewardPoints ?? 0}</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
