import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconMessageCircle2, IconBooks, IconCalendarTime, IconX } from "@tabler/icons-react";
import "../../../styles/ai-assistant-premium.css";

const TAB_DEFS = [
  { to: "/dashboard/ai-assistant", labelKey: "chat", icon: IconMessageCircle2, end: true },
  { to: "/dashboard/ai-assistant/prompts", labelKey: "promptLibrary", icon: IconBooks },
  { to: "/dashboard/ai-assistant/schedule", labelKey: "scheduledPrompts", icon: IconCalendarTime },
];

/**
 * Standalone layout for the 3 AI Assistant sub-pages. Deliberately NOT nested
 * inside MemberDashboard's `.member-dashboard` scaling wrapper — that wrapper
 * applies a CSS `transform: scale()` to fit a fixed 1200px design canvas,
 * which would silently break these pages' real Tailwind responsive
 * breakpoints (those react to actual viewport width, not the post-transform
 * visual size).
 */
export default function AiAssistantPageShell({ children }) {
  const { t } = useTranslation(["dashboardMain"]);
  const TABS = TAB_DEFS.map((tab) => ({ ...tab, label: t(`dashboardMain:aiAssistant.tabs.${tab.labelKey}`) }));
  return (
    <div className="ai-standalone-premium">
      <header className="ai-premium-page-header">
        <Link to="/dashboard" aria-label={t("dashboardMain:aiAssistant.common.backToDashboard")}><IconArrowLeft /><span>{t("dashboardMain:aiAssistant.common.backToDashboard")}</span></Link>
        <div><i>V</i><strong>V.Assist</strong></div>
        <Link to="/dashboard" aria-label={t("dashboardMain:aiAssistant.common.closeVAssist")}><IconX /></Link>
      </header>
      <nav className="ai-premium-page-tabs" aria-label={t("dashboardMain:aiAssistant.pageShell.navAriaLabel")}>
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? "is-active" : ""}
          >
            <Icon /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
