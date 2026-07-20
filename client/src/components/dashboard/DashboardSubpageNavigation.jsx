import { IconArrowLeft, IconHome } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard-subpage-navigation.css";

const LABELS = [
  [/^\/dashboard\/events\/[^/]+\/tickets/, "eventTickets", "/dashboard/events"],
  [/^\/dashboard\/events/, "myEvents", "/dashboard/events"],
  [/^\/dashboard\/donations/, "myDonations", "/dashboard/donations"],
  [/^\/dashboard\/sponsorships/, "mySponsorships", "/dashboard/sponsorships"],
  [/^\/dashboard\/profile/, "myProfile", "/dashboard/profile"],
  [/^\/dashboard\/wallet/, "vWallet", "/dashboard/wallet"],
  [/^\/dashboard\/vcommerce-buyer/, "buyerPortal", "/dashboard/vcommerce-buyer"],
  [/^\/dashboard\/vcommerce/, "businessHub", "/dashboard/vcommerce"],
  [/^\/dashboard\/ai-assistant\/prompts/, "promptLibrary", "/dashboard/ai-assistant/prompts"],
  [/^\/dashboard\/ai-assistant\/schedule/, "scheduledPrompts", "/dashboard/ai-assistant/schedule"],
  [/^\/dashboard\/ai-assistant/, "vAssist", "/dashboard/ai-assistant"],
];

export default function DashboardSubpageNavigation() {
  const { t } = useTranslation(["dashboardMain"]);
  const { pathname } = useLocation();
  if (pathname === "/dashboard" || !pathname.startsWith("/dashboard/")) return null;
  if (pathname.startsWith("/dashboard/ai-assistant")) return null;
  // The V.Commerce business hub renders these same two buttons itself, inline
  // next to its own "My Business" heading — skip the shared bar there.
  if (pathname === "/dashboard/vcommerce") return null;

  const [, labelKey, pageTarget] = LABELS.find(([pattern]) => pattern.test(pathname)) || [null, "dashboard", pathname];
  const pageLabel = t(`dashboardMain:subpageNav.labels.${labelKey}`);

  return (
    <div className="dashboard-subpage-nav" aria-label={t("dashboardMain:subpageNav.ariaLabel")}>
      <Link to="/dashboard" className="dashboard-subpage-nav__btn">
        <IconArrowLeft aria-hidden stroke={2} />
        <span>{t("dashboardMain:subpageNav.backToDashboard")}</span>
      </Link>
      <Link to={pageTarget} className="dashboard-subpage-nav__btn" aria-current="page">
        <IconHome aria-hidden stroke={1.8} />
        <span>{pageLabel}</span>
      </Link>
    </div>
  );
}
