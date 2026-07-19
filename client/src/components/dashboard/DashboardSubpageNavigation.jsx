import { IconArrowLeft, IconHome } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/dashboard-subpage-navigation.css";

const LABELS = [
  [/^\/dashboard\/events\/[^/]+\/tickets/, "Event Tickets", "/dashboard/events"],
  [/^\/dashboard\/events/, "My Events", "/dashboard/events"],
  [/^\/dashboard\/donations/, "My Donations", "/dashboard/donations"],
  [/^\/dashboard\/sponsorships/, "My Sponsorships", "/dashboard/sponsorships"],
  [/^\/dashboard\/profile/, "My Profile", "/dashboard/profile"],
  [/^\/dashboard\/wallet/, "V.Wallet", "/dashboard/wallet"],
  [/^\/dashboard\/vcommerce-buyer/, "Buyer Portal", "/dashboard/vcommerce-buyer"],
  [/^\/dashboard\/vcommerce/, "Business Hub", "/dashboard/vcommerce"],
  [/^\/dashboard\/ai-assistant\/prompts/, "Prompt Library", "/dashboard/ai-assistant/prompts"],
  [/^\/dashboard\/ai-assistant\/schedule/, "Scheduled Prompts", "/dashboard/ai-assistant/schedule"],
  [/^\/dashboard\/ai-assistant/, "V.Assist", "/dashboard/ai-assistant"],
];

export default function DashboardSubpageNavigation() {
  const { pathname } = useLocation();
  if (pathname === "/dashboard" || !pathname.startsWith("/dashboard/")) return null;
  if (pathname.startsWith("/dashboard/ai-assistant")) return null;
  // The V.Commerce business hub renders these same two buttons itself, inline
  // next to its own "My Business" heading — skip the shared bar there.
  if (pathname === "/dashboard/vcommerce") return null;

  const [, pageLabel, pageTarget] = LABELS.find(([pattern]) => pattern.test(pathname)) || [null, "Dashboard", pathname];

  return (
    <div className="dashboard-subpage-nav" aria-label="Dashboard navigation">
      <Link to="/dashboard" className="dashboard-subpage-nav__btn">
        <IconArrowLeft aria-hidden stroke={2} />
        <span>Back to Dashboard</span>
      </Link>
      <Link to={pageTarget} className="dashboard-subpage-nav__btn" aria-current="page">
        <IconHome aria-hidden stroke={1.8} />
        <span>{pageLabel}</span>
      </Link>
    </div>
  );
}
