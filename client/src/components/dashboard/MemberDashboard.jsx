import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconCalendarEvent,
  IconCrown,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import {
  buildQrSrc,
  DASHBOARD_ROUTES,
  downloadMembershipCard,
  planShortLabel,
} from "./dashboardUtils.js";
import DashboardWelcomeBannerSection from "./sections/DashboardWelcomeBannerSection.jsx";
import DashboardStatCardsSection from "./sections/DashboardStatCardsSection.jsx";
import DashboardMembershipCardSection from "./sections/DashboardMembershipCardSection.jsx";
import DashboardUpcomingEventsSection from "./sections/DashboardUpcomingEventsSection.jsx";
import DashboardRecentActivitySection from "./sections/DashboardRecentActivitySection.jsx";
import DashboardImpactSection from "./sections/DashboardImpactSection.jsx";
import DashboardClosingCtaSection from "./sections/DashboardClosingCtaSection.jsx";
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

export default function MemberDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [dash, mem] = await Promise.all([
        apiFetch("/api/dashboard", { headers: authHeaders() }),
        apiFetch("/api/dashboard/memberships", { headers: authHeaders() }).catch(() => null),
      ]);
      setDashboard(dash);
      setMembership(mem);
    } catch (e) {
      setLoadError(e.message || "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

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
  const hasMembership = Boolean(membership?.hasMembership && active);

  const qrSrc = useMemo(() => buildQrSrc(membershipId), [membershipId]);
  const activity = dashboard?.activity || [];

  const quickActions = [
    {
      id: "explore",
      label: "Explore Events",
      icon: <IconCalendarEvent size={20} stroke={1.75} />,
      to: DASHBOARD_ROUTES.events,
      tone: "teal",
    },
    {
      id: "download",
      label: "Download Card",
      icon: <IconDownload size={20} stroke={1.75} />,
      tone: "blue",
      onClick: () =>
        downloadMembershipCard(
          membership?.downloadCard || {
            membershipCode: membershipId,
            memberName: displayName,
            planName: planShort,
            validFrom: memberSince,
            validTo: validUntil,
          },
        ),
    },
    {
      id: "renew",
      label: "Renew Membership",
      icon: <IconRefresh size={20} stroke={1.75} />,
      to: DASHBOARD_ROUTES.membershipMatrix,
      tone: "green",
    },
    {
      id: "upgrade",
      label: "Upgrade Membership",
      icon: <IconCrown size={20} stroke={1.75} />,
      to: DASHBOARD_ROUTES.membershipMatrix,
      tone: "teal-dark",
    },
  ];

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">Loading your dashboard…</div>
      </DashboardShell>
    );
  }

  if (loadError) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="member-dashboard__retry" onClick={load}>
            Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardWelcomeBannerSection
        displayName={displayName}
        planShort={planShort}
        hasMembership={hasMembership}
      />

      <div className="member-dashboard__body">
        <DashboardStatCardsSection
          overview={overview}
          hasMembership={hasMembership}
          planId={planId}
        />

        <DashboardMembershipCardSection
          displayName={displayName}
          planShort={planShort}
          membershipId={membershipId}
          memberSince={memberSince}
          validUntil={validUntil}
          hasMembership={hasMembership}
          qrSrc={qrSrc}
        />

        <DashboardUpcomingEventsSection />

        <DashboardImpactSection overview={overview} />

        <DashboardRecentActivitySection activity={activity} quickActions={quickActions} />

        <DashboardClosingCtaSection />
      </div>
    </DashboardShell>
  );
}
