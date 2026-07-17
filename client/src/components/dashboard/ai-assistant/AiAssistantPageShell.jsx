import { Link, NavLink } from "react-router-dom";
import { IconArrowLeft, IconMessageCircle2, IconBooks, IconCalendarTime, IconX } from "@tabler/icons-react";
import "../../../styles/ai-assistant-premium.css";

const TABS = [
  { to: "/dashboard/ai-assistant", label: "Chat", icon: IconMessageCircle2, end: true },
  { to: "/dashboard/ai-assistant/prompts", label: "Prompt Library", icon: IconBooks },
  { to: "/dashboard/ai-assistant/schedule", label: "Scheduled Prompts", icon: IconCalendarTime },
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
  return (
    <div className="ai-standalone-premium">
      <header className="ai-premium-page-header">
        <Link to="/dashboard" aria-label="Back to dashboard"><IconArrowLeft /><span>Back to dashboard</span></Link>
        <div><i>V</i><strong>V.Assist</strong></div>
        <Link to="/dashboard" aria-label="Close V Assist"><IconX /></Link>
      </header>
      <nav className="ai-premium-page-tabs" aria-label="AI Assistant sections">
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
