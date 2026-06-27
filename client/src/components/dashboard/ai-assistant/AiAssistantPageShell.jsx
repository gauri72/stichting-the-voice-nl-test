import { NavLink } from "react-router-dom";
import { IconMessageCircle2, IconBooks, IconCalendarTime } from "@tabler/icons-react";

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <nav className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-900/60 p-1 ring-1 ring-white/10" aria-label="AI Assistant sections">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 ${
                isActive ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
