import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookTickets, ExportCsv, ManageMembership } from "../icons/icons/index.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import {
  DASHBOARD_ROUTES,
  planShortLabel,
  resolveMembershipQrSrc,
} from "./dashboardUtils.js";
import { downloadMembershipEcard } from "../../utils/membershipEcard.js";
import CustomerDashboardRenderer from "./CustomerDashboardRenderer.jsx";
import DashboardWelcomeBannerSection from "./sections/DashboardWelcomeBannerSection.jsx";
import DashboardMyBookingsSection from "./sections/DashboardMyBookingsSection.jsx";
import DashboardStatCardsSection from "./sections/DashboardStatCardsSection.jsx";
import DashboardMembershipCardSection from "./sections/DashboardMembershipCardSection.jsx";
import DashboardMyEventsWidget from "./sections/DashboardMyEventsWidget.jsx";
import DashboardBusinessHubBanner from "./sections/DashboardBusinessHubBanner.jsx";
import DashboardMyOrdersSection from "./sections/DashboardMyOrdersSection.jsx";
import DashboardMySessionsSection from "./sections/DashboardMySessionsSection.jsx";
import DashboardRecentActivitySection from "./sections/DashboardRecentActivitySection.jsx";
import DashboardImpactSection from "./sections/DashboardImpactSection.jsx";
import DashboardDiscountsSection from "./sections/DashboardDiscountsSection.jsx";
import DashboardReferralSection from "./sections/DashboardReferralSection.jsx";
import DashboardClosingCtaSection from "./sections/DashboardClosingCtaSection.jsx";
import MobileDashboardCommandCenter from "./mobile/MobileDashboardCommandCenter.jsx";
import useIsMobileViewport from "../../hooks/useIsMobileViewport.js";
import "../../styles/dashboard-shared.css";
import "../../styles/dashboard-desktop.css";
import "../../styles/dashboard-mobile.css";

const DASHBOARD_DESIGN_WIDTH = 1200;
const DASHBOARD_MOBILE_BREAKPOINT = 768;

function useDashboardViewportScale(contentRef) {
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const update = () => {
      const available = viewport.clientWidth;

      if (available < DASHBOARD_MOBILE_BREAKPOINT) {
        content.style.width = "";
        content.style.transform = "";
        content.style.transformOrigin = "";
        viewport.style.height = "";
        viewport.dataset.layout = "mobile";
        return;
      }

      viewport.dataset.layout = "desktop";
      const scale = Math.min(1, available / DASHBOARD_DESIGN_WIDTH);

      if (scale >= 1) {
        content.style.width = "";
        content.style.transform = "";
        content.style.transformOrigin = "";
        viewport.style.height = "";
        return;
      }

      content.style.width = `${DASHBOARD_DESIGN_WIDTH}px`;
      content.style.transformOrigin = "top left";
      content.style.transform = `scale(${scale})`;
      viewport.style.height = `${content.offsetHeight * scale}px`;
    };

    update();

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    observer.observe(viewport);
    observer.observe(content);

    return () => observer.disconnect();
  }, [contentRef]);

  return viewportRef;
}

function DashboardShell({ children }) {
  const contentRef = useRef(null);
  const viewportRef = useDashboardViewportScale(contentRef);

  return (
    <div className="member-dashboard-viewport" ref={viewportRef}>
      <section className="member-dashboard" ref={contentRef}>
        {children}
      </section>
    </div>
  );
}

function LegacyMemberDashboard({ displayName, overview, activity, membership, hasMembership, planId, planShort, membershipId, memberSince, validUntil, validFrom, qrSrc, wallet, quickActions }) {
  return (
    <>
      <DashboardWelcomeBannerSection
        displayName={displayName}
        membershipId={membershipId}
        hasMembership={hasMembership}
        planShort={planShort}
        planId={planId}
        memberSince={memberSince}
        validUntil={validUntil}
        validFrom={validFrom}
        qrSrc={qrSrc}
        wallet={wallet}
      />
      <div className="member-dashboard__body">
        <div className="dash-bookings-events-row">
          <div className="dash-bookings-events-row__col">
            <DashboardMyBookingsSection compact />
            <DashboardMyEventsWidget compact />
            <DashboardBusinessHubBanner />
            <DashboardMyOrdersSection />
          </div>
          <div className="dash-bookings-events-row__col">
            <DashboardMembershipCardSection
              planShort={planShort}
              planId={planId}
              membershipId={membershipId}
              memberSince={memberSince}
              validUntil={validUntil}
              validFrom={validFrom}
              hasMembership={hasMembership}
              qrSrc={qrSrc}
              wallet={wallet}
              compact
            />
          </div>
        </div>
        <DashboardStatCardsSection overview={overview} hasMembership={hasMembership} planId={planId} />
        <DashboardDiscountsSection />
        <DashboardMySessionsSection />
        <DashboardReferralSection />
        <DashboardImpactSection overview={overview} />
        <DashboardRecentActivitySection activity={activity} quickActions={quickActions} />
        <DashboardClosingCtaSection />
      </div>
    </>
  );
}

export default function MemberDashboard() {
  const { t } = useTranslation(["dashboardMain"]);
  const { user } = useAuth();
  const isMobile = useIsMobileViewport(DASHBOARD_MOBILE_BREAKPOINT - 1);
  const [dashboard, setDashboard] = useState(null);
  const [membership, setMembership] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [dash, mem, configRes, dataRes] = await Promise.all([
        apiFetch("/api/dashboard", { headers: authHeaders() }),
        apiFetch("/api/dashboard/memberships", { headers: authHeaders() }).catch(() => null),
        apiFetch("/api/dashboard/config", { headers: authHeaders() }).catch(() => ({ sections: null })),
        apiFetch("/api/dashboard/data", { headers: authHeaders() }).catch(() => null),
      ]);
      setDashboard(dash);
      setMembership(mem);
      setDashboardConfig(configRes?.sections ? configRes : null);
      setDashboardData(dataRes);
    } catch (e) {
      setLoadError(e.message || t("dashboardMain:memberDashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const profile = dashboard?.profile;
  const overview = dashboard?.overview;
  const active = membership?.active;

  const displayName =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Member";

  const planId = active?.planId;
  const planShort = active ? planShortLabel(planId, active.planNameAccent) : "Membership";
  const membershipId = active?.membershipCode || active?.membershipNumber || "—";
  const validUntil = active?.validTo || "—";
  const memberSince = active?.validFrom || profile?.memberSince || "—";
  const validFrom = active?.validFromIso || active?.validFrom || memberSince;
  const hasMembership = Boolean(membership?.hasMembership && active);
  const wallet = membership?.wallet || {};

  const qrSrc = useMemo(
    () => resolveMembershipQrSrc(active?.qrCodeUrl, membershipId),
    [active?.qrCodeUrl, membershipId],
  );
  const activity = dashboard?.activity || [];

  const quickActions = [
    {
      id: "explore",
      label: t("dashboardMain:common.quickActions.exploreEvents"),
      icon: <BookTickets width={20} height={20} />,
      to: DASHBOARD_ROUTES.myEvents,
      tone: "teal",
    },
    {
      id: "download",
      label: t("dashboardMain:common.quickActions.downloadCard"),
      icon: <ExportCsv width={20} height={20} />,
      tone: "blue",
      onClick: () => {
        const card = document.querySelector(".voice-ecard:not(.voice-ecard--empty)");
        if (card) {
          downloadMembershipEcard(card, membershipId);
        }
      },
    },
    {
      id: "renew",
      label: t("dashboardMain:common.quickActions.renewMembership"),
      icon: <ManageMembership width={20} height={20} />,
      to: DASHBOARD_ROUTES.membershipMatrix,
      tone: "green",
    },
    {
      id: "upgrade",
      label: t("dashboardMain:common.quickActions.upgradeMembership"),
      icon: <ManageMembership width={20} height={20} />,
      to: DASHBOARD_ROUTES.membershipMatrix,
      tone: "teal-dark",
    },
  ];

  const mergedData = useMemo(
    () => ({
      ...dashboardData,
      profile: dashboardData?.profile || profile,
      overview: dashboardData?.overview || overview,
      activity: dashboardData?.activity || activity,
      membership: dashboardData?.membership || membership,
    }),
    [dashboardData, profile, overview, activity, membership]
  );

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">{t("dashboardMain:memberDashboard.loading")}</div>
      </DashboardShell>
    );
  }

  if (loadError) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="member-dashboard__retry" onClick={load}>
            {t("dashboardMain:common.tryAgain")}
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {isMobile ? (
        <MobileDashboardCommandCenter
          displayName={displayName}
          overview={overview}
          membership={membership}
          hasMembership={hasMembership}
          planShort={planShort}
          membershipId={membershipId}
          memberSince={memberSince}
          validUntil={validUntil}
          qrSrc={qrSrc}
        />
      ) : dashboardConfig?.sections?.length ? (
        <CustomerDashboardRenderer
          config={dashboardConfig}
          data={mergedData}
          displayName={displayName}
        />
      ) : (
        <LegacyMemberDashboard
          displayName={displayName}
          overview={overview}
          activity={activity}
          membership={membership}
          hasMembership={hasMembership}
          planId={planId}
          planShort={planShort}
          membershipId={membershipId}
          memberSince={memberSince}
          validUntil={validUntil}
          validFrom={validFrom}
          qrSrc={qrSrc}
          wallet={wallet}
          quickActions={quickActions}
        />
      )}
    </DashboardShell>
  );
}
