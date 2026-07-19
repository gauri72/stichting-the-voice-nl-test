import { useEffect } from "react";
import { IconArrowLeft, IconHome } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/dashboard-subpage-navigation.css";

// The site header's height is fluid (clamp()-based padding, varies by viewport),
// so this pill — also position: sticky — needs to sit below its *actual* rendered
// height rather than a guessed pixel value, or the two overlap.
function useSiteHeaderHeightVar() {
  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return undefined;

    const setVar = () => {
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };
    setVar();

    const observer = new ResizeObserver(setVar);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
}

const LABELS = [
  [/^\/dashboard\/events\/[^/]+\/tickets/, "Event Tickets"],
  [/^\/dashboard\/events/, "My Events"],
  [/^\/dashboard\/donations/, "My Donations"],
  [/^\/dashboard\/sponsorships/, "My Sponsorships"],
  [/^\/dashboard\/profile/, "My Profile"],
  [/^\/dashboard\/wallet/, "V.Wallet"],
  [/^\/dashboard\/vcommerce-buyer/, "Buyer Portal"],
  [/^\/dashboard\/vcommerce/, "Business Hub"],
  [/^\/dashboard\/ai-assistant\/prompts/, "Prompt Library"],
  [/^\/dashboard\/ai-assistant\/schedule/, "Scheduled Prompts"],
  [/^\/dashboard\/ai-assistant/, "V.Assist"],
];

export default function DashboardSubpageNavigation() {
  const { pathname } = useLocation();
  useSiteHeaderHeightVar();
  if (pathname === "/dashboard" || !pathname.startsWith("/dashboard/")) return null;
  if (pathname.startsWith("/dashboard/ai-assistant")) return null;

  const pageLabel = LABELS.find(([pattern]) => pattern.test(pathname))?.[1] || "Dashboard";

  return (
    <nav className="dashboard-subpage-nav" aria-label="Dashboard navigation">
      <Link to="/dashboard" className="dashboard-subpage-nav__back">
        <IconArrowLeft aria-hidden stroke={2} />
        <span>Back to Dashboard</span>
      </Link>
      <span className="dashboard-subpage-nav__context" aria-current="page">
        <IconHome aria-hidden stroke={1.8} />
        {pageLabel}
      </span>
    </nav>
  );
}
