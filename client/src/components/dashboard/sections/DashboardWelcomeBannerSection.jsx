import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaIdCard } from "react-icons/fa";
import { IconSparkles, IconCopy, IconCheck, IconWallet, IconTicket, IconCrown, IconRobot, IconGift } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import HeroActionCluster from "../../layout/HeroActionCluster.jsx";
import DashboardMembershipModal from "./DashboardMembershipModal.jsx";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { DASHBOARD_ROUTES, membershipBadgeLabel } from "../dashboardUtils.js";
import "../../../styles/dashboard-welcome-banner-section.css";

function formatMoney(minor = 0) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(minor || 0) / 100);
}

export default function DashboardWelcomeBannerSection({
  displayName,
  greeting,
  title,
  membershipId,
  hasMembership,
  planShort,
  planId,
  memberSince,
  validUntil,
  validFrom,
  qrSrc,
  wallet,
}) {
  const { t, i18n } = useTranslation(["dashboardSections", "dashboardMobile"]);
  const resolvedGreeting = greeting ?? t("dashboardSections:welcomeBannerSection.greetingDefault");
  const { isDark } = useTheme();
  const { openAssistant } = useAiAssistant();
  const { wallet: walletData, loadWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [aiTooltipVisible, setAiTooltipVisible] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [giftCopied, setGiftCopied] = useState(false);
  const aiTooltipId = useId();
  const metricsRef = useRef(null);
  const [metricsStyle, setMetricsStyle] = useState(null);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    apiFetch("/api/dashboard/bookings", { headers: authHeaders() })
      .then((data) => setBookings(data?.bookings || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch("/api/dashboard/referrals", { headers: authHeaders() })
      .then((data) => {
        if (data?.enabled && data?.referral?.referralCode?.code) {
          setReferralCode(data.referral.referralCode.code);
        }
      })
      .catch(() => {});
  }, []);

  // Position the metrics tiles directly under the header's "Shivam"/account
  // button — same technique HeroActionCluster itself uses (see
  // HeroActionCluster.jsx's own reposition effect), now that the tiles sit
  // above the button row instead of below it. HeroActionCluster in turn
  // anchors itself under these tiles via its `anchorSelector` prop (set
  // below), so the two rows stay swapped without either hardcoding
  // knowledge of the other's internals.
  useLayoutEffect(() => {
    const metricsEl = metricsRef.current;
    if (!metricsEl) return undefined;

    function reposition() {
      const anchorEl = document.querySelector(".nav-toolbar__cta-auth");
      const heroEl = metricsEl.offsetParent;
      if (!anchorEl || !heroEl) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const heroRect = heroEl.getBoundingClientRect();

      const right = Math.max(heroRect.right - anchorRect.right, 8);
      const top = anchorRect.bottom - heroRect.top + 14;

      setMetricsStyle({ right: `${right}px`, top: `${top}px` });
    }

    reposition();
    const raf = requestAnimationFrame(reposition);

    const anchorEl = document.querySelector(".nav-toolbar__cta-auth");
    const resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(metricsEl);
    if (anchorEl) resizeObserver.observe(anchorEl);

    window.addEventListener("resize", reposition);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("resize", reposition);
    };
  }, [i18n.language]);

  const rewards = walletData?.rewardPoints ?? 0;
  const balance = walletData?.balanceMinor ?? 0;
  const ticketCount = bookings.reduce((sum, booking) => sum + Number(booking.ticketCount || booking.tickets?.length || 0), 0);
  const membershipLabel = membershipBadgeLabel(planShort);
  const membershipTier = String(planShort || t("dashboardMobile:commandCenter.hero.memberFallback")).replace(/\s+(Family|Single)$/i, "") || t("dashboardMobile:commandCenter.hero.memberFallback");

  function showAiTooltip() {
    setAiTooltipVisible(true);
  }
  function hideAiTooltip() {
    setAiTooltipVisible(false);
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

  async function handleCopyReferralCode() {
    try {
      await navigator.clipboard.writeText(referralCode);
      setGiftCopied(true);
      setTimeout(() => setGiftCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the code is still visible to select/copy manually.
    }
  }

  return (
    <>
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

      <HeroActionCluster anchorSelector=".dash-welcome .dash-welcome__metrics" />

      <div className="dash-welcome__content">
        <p className="dash-welcome__greeting">{resolvedGreeting}</p>
        <h1
          id="dash-welcome-name"
          className={`dash-welcome__name${isDark ? "" : " dash-grad-text"}`}
        >
          {displayName}
        </h1>
        {hasMembership ? (
          <span className="dash-welcome__membership-badge">
            <IconCrown size={16} aria-hidden="true" />
            {membershipLabel}
          </span>
        ) : null}
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
            <IconRobot aria-hidden="true" className="dash-welcome__ai-cta-icon" />
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

        {referralCode ? (
          <button
            type="button"
            className="dash-welcome__membership-code dash-welcome__membership-code--gift"
            onClick={handleCopyReferralCode}
            aria-label={t("dashboardSections:welcomeBannerSection.copyReferralCodeAriaLabel", { code: referralCode })}
          >
            <span className="dash-welcome__membership-code-label dash-welcome__membership-code-label--blink">
              <IconGift size={14} aria-hidden="true" className="dash-welcome__gift-sparkle-icon" />
              {t("dashboardSections:welcomeBannerSection.yourGiftLabel")}
            </span>
            <span className="dash-welcome__membership-code-row">
              <span className="dash-welcome__membership-code-value">{referralCode}</span>
              {giftCopied ? (
                <IconCheck size={20} aria-hidden="true" className="dash-welcome__membership-code-icon dash-welcome__membership-code-icon--copied" />
              ) : (
                <IconCopy size={20} aria-hidden="true" className="dash-welcome__membership-code-icon" />
              )}
            </span>
          </button>
        ) : null}
      </div>

      <div
        className="dash-welcome__metrics"
        ref={metricsRef}
        style={metricsStyle || undefined}
        aria-label={t("dashboardMobile:commandCenter.hero.metricsAria")}
      >
          <Link
            to="/dashboard/wallet"
            className="dash-welcome__metric dash-welcome__metric--rewards"
            aria-label={t("dashboardMobile:commandCenter.hero.rewardsAria", { count: rewards })}
          >
            <IconSparkles aria-hidden />
            <b>{rewards}</b>
            <small>{t("dashboardMobile:commandCenter.hero.pointsLabel")}</small>
          </Link>
          <Link
            to="/dashboard/wallet"
            className="dash-welcome__metric dash-welcome__metric--wallet"
            aria-label={t("dashboardMobile:commandCenter.hero.walletAria", { balance: formatMoney(balance) })}
          >
            <IconWallet aria-hidden />
            <b>{formatMoney(balance)}</b>
            <small>{t("dashboardMobile:commandCenter.hero.walletLabel")}</small>
          </Link>
          <Link
            to={DASHBOARD_ROUTES.myEvents}
            className="dash-welcome__metric dash-welcome__metric--tickets"
            aria-label={t("dashboardMobile:commandCenter.hero.ticketsAria", { count: ticketCount })}
          >
            <IconTicket aria-hidden />
            <b>{ticketCount}</b>
            <small>{t("dashboardMobile:commandCenter.hero.ticketsLabel")}</small>
          </Link>
          <button
            type="button"
            className="dash-welcome__metric dash-welcome__metric--membership"
            onClick={() => setMembershipModalOpen(true)}
            aria-label={t("dashboardMobile:commandCenter.hero.membershipAria", { label: membershipLabel })}
          >
            <IconCrown aria-hidden />
            <b>{membershipTier}</b>
            <small>{t("dashboardMobile:commandCenter.hero.membershipLabel")}</small>
          </button>
          <Link
            to={DASHBOARD_ROUTES.profile}
            className="dash-welcome__metric dash-welcome__metric--profile"
            aria-label={t("dashboardSections:welcomeBannerSection.myProfileAriaLabel")}
          >
            <FaIdCard aria-hidden />
            <b>{t("dashboardSections:welcomeBannerSection.myProfileLabel")}</b>
          </Link>
      </div>
    </header>

    <DashboardMembershipModal
      open={membershipModalOpen}
      onClose={() => setMembershipModalOpen(false)}
      planShort={planShort}
      planId={planId}
      membershipId={membershipId}
      memberSince={memberSince}
      validUntil={validUntil}
      validFrom={validFrom}
      hasMembership={hasMembership}
      qrSrc={qrSrc}
      wallet={wallet}
    />
    </>
  );
}
