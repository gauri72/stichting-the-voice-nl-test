import { Link, useLocation } from "react-router-dom";
import {
  IconCalendarEvent,
  IconHeartHandshake,
  IconHome,
  IconUser,
} from "@tabler/icons-react";
import { PROFILE_ROUTES } from "../profileUtils.js";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", to: PROFILE_ROUTES.dashboard, Icon: IconHome },
  { id: "events", label: "Events", to: PROFILE_ROUTES.events, Icon: IconCalendarEvent },
  {
    id: "memberships",
    label: "Memberships",
    to: PROFILE_ROUTES.membership,
    Icon: IconHeartHandshake,
  },
  { id: "profile", label: "Profile", to: PROFILE_ROUTES.profile, Icon: IconUser },
];

export default function ProfileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="profile-bottom-nav" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ id, label, to, Icon }) => {
        const isActive = pathname === to || (id === "profile" && pathname.startsWith("/dashboard/profile"));
        return (
          <Link
            key={id}
            to={to}
            className={`profile-bottom-nav__item${isActive ? " profile-bottom-nav__item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} stroke={1.75} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
