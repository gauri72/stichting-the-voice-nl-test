import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaIdCard, FaSignOutAlt } from "react-icons/fa";
import { IconSparkles, IconCopy, IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
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
  greeting,
  title,
  membershipId,
  hasMembership,
}) {
  const { t } = useTranslation(["dashboardSections"]);
  const resolvedGreeting = greeting ?? t("dashboardSections:welcomeBannerSection.greetingDefault");
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
      <div className="dash-welcome__bg">
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
        {hasMembership && membershipId ? (
          <button
            type="button"
            className="dash-welcome__membership-code"
            onClick={handleCopyMembershipId}
            aria-label={t("dashboardSections:welcomeBannerSection.copyMembershipCodeAriaLabel", { code: membershipId })}
          >
            <span className="dash-welcome__membership-code-label">
              {t("dashboardSections:welcomeBannerSection.membershipCodeLabel")}
            </span>
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

      <div className="dash-welcome__content">
        <p className="dash-welcome__greeting">{resolvedGreeting}</p>
        <h1
          id="dash-welcome-name"
          className={`dash-welcome__name${isDark ? "" : " dash-grad-text"}`}
        >
          {displayName}
        </h1>
        <div className="dash-welcome__ai-cta-wrap">
          <button
            type="button"
            onClick={openAssistant}
            onMouseEnter={showAiTooltip}
            onMouseLeave={hideAiTooltip}
            onFocus={showAiTooltip}
            onBlur={hideAiTooltip}
            className="dash-welcome__ai-cta"
            aria-label={t("dashboardSections:welcomeBannerSection.openAssistantAriaLabel")}
            aria-describedby={aiTooltipId}
          >
            <IconSparkles size={16} aria-hidden="true" className="dash-welcome__ai-cta-icon" />
            <span className="dash-welcome__ai-cta-label">{t("dashboardSections:welcomeBannerSection.assistantLabel")}</span>
          </button>
          {aiTooltipVisible ? (
            <div id={aiTooltipId} role="tooltip" className="dash-welcome__ai-tooltip">
              <p>{t("dashboardSections:welcomeBannerSection.tooltipLine1")}</p>
              <p>{t("dashboardSections:welcomeBannerSection.tooltipLine2")}</p>
              <p>{t("dashboardSections:welcomeBannerSection.tooltipLine3")}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="dash-welcome__bottom-panel">
        <div className="dash-welcome__account-actions">
          <Link
            to="/dashboard/wallet"
            className="dash-welcome__badge dash-welcome__btn--wallet"
            aria-label={t("dashboardSections:welcomeBannerSection.walletAriaLabel")}
          >
            <PayWallet width="1em" height="1em" aria-hidden="true" className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">{t("dashboardSections:welcomeBannerSection.walletLabel")}</span>
          </Link>
          <Link
            to={DASHBOARD_ROUTES.profile}
            className="dash-welcome__badge dash-welcome__btn--profile"
            aria-label={t("dashboardSections:welcomeBannerSection.myProfileAriaLabel")}
          >
            <FaIdCard aria-hidden className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">{t("dashboardSections:welcomeBannerSection.myProfileLabel")}</span>
          </Link>
          <button
            type="button"
            className="dash-welcome__badge dash-welcome__btn--logout"
            onClick={handleLogout}
            aria-label={t("dashboardSections:welcomeBannerSection.logOutAriaLabel")}
          >
            <FaSignOutAlt aria-hidden className="dash-welcome__badge-icon" />
            <span className="dash-welcome__badge-label">{t("dashboardSections:welcomeBannerSection.logOutLabel")}</span>
          </button>
        </div>
        {walletData?.enabled ? (
          <Link
            to="/dashboard/wallet"
            className="dash-welcome__points-chip"
            aria-label={t("dashboardSections:welcomeBannerSection.pointsChipAriaLabel", {
              points: walletData.rewardPoints ?? 0,
            })}
          >
            <span className="dash-welcome__points-chip-label">{t("dashboardSections:welcomeBannerSection.redeemPoints")}</span>
            <span className="dash-welcome__points-chip-value">{walletData.rewardPoints ?? 0}</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
