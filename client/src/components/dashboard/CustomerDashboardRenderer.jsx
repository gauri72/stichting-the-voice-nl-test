import {
  IconCalendarEvent,
  IconCrown,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import DashboardWelcomeBannerSection from "./sections/DashboardWelcomeBannerSection.jsx";
import DashboardStatCardsSection from "./sections/DashboardStatCardsSection.jsx";
import DashboardMembershipCardSection from "./sections/DashboardMembershipCardSection.jsx";
import DashboardMyEventsWidget from "./sections/DashboardMyEventsWidget.jsx";
import DashboardRecentActivitySection from "./sections/DashboardRecentActivitySection.jsx";
import DashboardImpactSection from "./sections/DashboardImpactSection.jsx";
import DashboardDiscountsSection from "./sections/DashboardDiscountsSection.jsx";
import DashboardReferralSection from "./sections/DashboardReferralSection.jsx";
import DashboardClosingCtaSection from "./sections/DashboardClosingCtaSection.jsx";
import DashboardUpcomingEventsSection from "./sections/DashboardUpcomingEventsSection.jsx";
import CustomerDashboardCustomCtaBanner from "./sections/CustomerDashboardCustomCtaBanner.jsx";
import CustomerDashboardRichTextBlock from "./sections/CustomerDashboardRichTextBlock.jsx";
import CustomerDashboardAnnouncements, {
  CustomerDashboardMembershipStatus,
  CustomerDashboardMyTickets,
  CustomerDashboardProfileWidget,
  CustomerDashboardSupportWidget,
} from "./sections/CustomerDashboardGenericWidgets.jsx";
import { DASHBOARD_ROUTES, planShortLabel, resolveMembershipQrSrc } from "./dashboardUtils.js";
import { downloadMembershipEcard } from "../../utils/membershipEcard.js";

function buildQuickActions({ membershipId, section }) {
  const configured = section?.settings?.quickActions;
  if (Array.isArray(configured) && configured.length) {
    return configured.filter((a) => a.visible !== false);
  }
  return [
    {
      id: "explore",
      label: "Explore Events",
      icon: <IconCalendarEvent size={20} stroke={1.75} />,
      to: DASHBOARD_ROUTES.myEvents,
      tone: "teal",
    },
    {
      id: "download",
      label: "Download Card",
      icon: <IconDownload size={20} stroke={1.75} />,
      tone: "blue",
      onClick: () => {
        const card = document.querySelector(".voice-ecard:not(.voice-ecard--empty)");
        if (card) downloadMembershipEcard(card, membershipId);
      },
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
}

function ConfigurableWelcomeBanner({ section, settings, displayName }) {
  const greeting = section?.settings?.greeting || settings?.welcomeMessage?.split(",")[0] || "Welcome,";
  const name = settings?.welcomeMessage?.includes("{{name}}")
    ? displayName
    : settings?.welcomeMessage?.split(",").slice(1).join(",").trim() || displayName;

  return (
    <DashboardWelcomeBannerSection
      displayName={name}
      greeting={greeting.replace(/,\s*$/, "")}
      title={section?.title}
    />
  );
}

function renderSection(section, ctx) {
  const {
    displayName,
    settings,
    overview,
    activity,
    membership,
    hasMembership,
    planId,
    planShort,
    membershipId,
    memberSince,
    validUntil,
    validFrom,
    qrSrc,
    wallet,
    profile,
    preview,
  } = ctx;

  switch (section.sectionType) {
    case "welcome_banner":
      return (
        <ConfigurableWelcomeBanner
          key={section.sectionId}
          section={section}
          settings={settings}
          displayName={displayName}
        />
      );
    case "available_discounts":
      return <DashboardDiscountsSection key={section.sectionId} />;
    case "my_events":
      return <DashboardMyEventsWidget key={section.sectionId} />;
    case "referral_code":
      return <DashboardReferralSection key={section.sectionId} />;
    case "stat_cards":
      return (
        <DashboardStatCardsSection
          key={section.sectionId}
          overview={overview}
          hasMembership={hasMembership}
          planId={planId}
        />
      );
    case "digital_membership_card":
    case "membership_status":
      if (section.sectionType === "membership_status") {
        return (
          <CustomerDashboardMembershipStatus
            key={section.sectionId}
            section={section}
            membership={membership}
            hasMembership={hasMembership}
            planId={planId}
          />
        );
      }
      return (
        <DashboardMembershipCardSection
          key={section.sectionId}
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
      );
    case "membership_benefits":
      return (
        <DashboardMembershipCardSection
          key={section.sectionId}
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
      );
    case "impact_section":
      return <DashboardImpactSection key={section.sectionId} overview={overview} />;
    case "recent_activity":
    case "quick_actions":
      return (
        <DashboardRecentActivitySection
          key={section.sectionId}
          activity={activity}
          quickActions={
            section.sectionType === "quick_actions" || section.settings?.showQuickActions !== false
              ? buildQuickActions({ membershipId, section })
              : []
          }
        />
      );
    case "closing_cta":
      return <DashboardClosingCtaSection key={section.sectionId} />;
    case "upcoming_events":
    case "featured_events":
      return <DashboardUpcomingEventsSection key={section.sectionId} />;
    case "my_tickets":
      return <CustomerDashboardMyTickets key={section.sectionId} section={section} />;
    case "donations_cta":
      return (
        <CustomerDashboardCustomCtaBanner
          key={section.sectionId}
          section={{
            ...section,
            ctas: section.ctas?.length
              ? section.ctas
              : [{ id: "donate", text: "Donate Now", url: "/donate", style: "primary", visible: true }],
          }}
        />
      );
    case "sponsorship_cta":
      return (
        <CustomerDashboardCustomCtaBanner
          key={section.sectionId}
          section={{
            ...section,
            ctas: section.ctas?.length
              ? section.ctas
              : [{ id: "sponsor", text: "Become a Sponsor", url: "/sponsorship", style: "teal", visible: true }],
          }}
        />
      );
    case "volunteer_cta":
      return (
        <CustomerDashboardCustomCtaBanner
          key={section.sectionId}
          section={{
            ...section,
            ctas: section.ctas?.length
              ? section.ctas
              : [{ id: "volunteer", text: "Volunteer With Us", url: "/contact-us", style: "secondary", visible: true }],
          }}
        />
      );
    case "custom_cta_banner":
      return <CustomerDashboardCustomCtaBanner key={section.sectionId} section={section} />;
    case "custom_rich_text":
      return <CustomerDashboardRichTextBlock key={section.sectionId} section={section} />;
    case "announcements":
      return <CustomerDashboardAnnouncements key={section.sectionId} section={section} settings={settings} />;
    case "support_contact":
      return <CustomerDashboardSupportWidget key={section.sectionId} section={section} />;
    case "profile_details":
      return (
        <CustomerDashboardProfileWidget
          key={section.sectionId}
          section={section}
          profile={profile}
        />
      );
    case "payment_methods":
      return preview ? (
        <section key={section.sectionId} className="member-dashboard__profile-widget">
          <h2 className="member-dashboard__section-title">{section?.title || "Payment Methods"}</h2>
          <p>Payment methods appear here for the logged-in member.</p>
        </section>
      ) : null;
    default:
      return null;
  }
}

export default function CustomerDashboardRenderer({
  config,
  data,
  displayName,
  preview = false,
}) {
  const settings = config?.settings || {};
  const sections = config?.sections || [];
  const profile = data?.profile;
  const overview = data?.overview;
  const activity = data?.activity || [];
  const membership = data?.membership;
  const active = membership?.active;

  const planId = active?.planId;
  const planShort = active ? planShortLabel(planId, active.planNameAccent) : "Membership";
  const membershipId = active?.membershipCode || active?.membershipNumber || "—";
  const validUntil = active?.validTo || "—";
  const memberSince = active?.validFrom || profile?.memberSince || "—";
  const validFrom = active?.validFromIso || active?.validFrom || memberSince;
  const hasMembership = Boolean(membership?.hasMembership && active);
  const wallet = membership?.wallet || {};
  const qrSrc = resolveMembershipQrSrc(active?.qrCodeUrl, membershipId);

  const ctx = {
    displayName,
    settings,
    overview,
    activity,
    membership,
    hasMembership,
    planId,
    planShort,
    membershipId,
    memberSince,
    validUntil,
    validFrom,
    qrSrc,
    wallet,
    profile,
    preview,
  };

  const welcomeSection = sections.find((s) => s.sectionType === "welcome_banner");
  const bodySections = sections.filter((s) => s.sectionType !== "welcome_banner");

  return (
    <>
      {settings?.announcement?.visible && settings.announcement.text ? (
        <div className="member-dashboard__top-announcement" role="status">
          {settings.announcement.text}
        </div>
      ) : null}

      {welcomeSection ? renderSection(welcomeSection, ctx) : (
        <ConfigurableWelcomeBanner section={null} settings={settings} displayName={displayName} />
      )}

      <div className="member-dashboard__body">
        {bodySections.map((section) => renderSection(section, ctx))}
        {settings?.footerText ? (
          <footer className="member-dashboard__footer-text">
            <p>{settings.footerText}</p>
          </footer>
        ) : null}
      </div>
    </>
  );
}
