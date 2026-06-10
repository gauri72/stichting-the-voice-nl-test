import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  IconBell,
  IconChartBar,
  IconLayoutDashboard,
  IconLogout,
  IconMail,
  IconMenu2,
  IconTicket,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import ThemeToggle from "../layout/ThemeToggle.jsx";
import "../../styles/admin-layout.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard, end: true },
  { to: "/admin/events", label: "Events", icon: IconTicket },
  { to: "/admin/members", label: "Members", icon: IconUsers },
  { to: "/admin/communication", label: "Communication", icon: IconMail },
  { to: "/admin/reports", label: "More", icon: IconChartBar },
];

export default function AdminLayout({ children, pageTitle, pageSubtitle }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div className="admin-layout">
      <header className="admin-layout__topbar">
        <button
          type="button"
          className="admin-layout__menu"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          {drawerOpen ? <IconX size={22} stroke={1.8} /> : <IconMenu2 size={22} stroke={1.8} />}
        </button>

        <div className="admin-layout__brand">
          <span className="admin-layout__mark">V.</span>
          <div className="admin-layout__brand-copy">
            <p>Stichting The V.O.I.C.E. NL</p>
          </div>
        </div>

        <div className="admin-layout__actions">
          <button type="button" className="admin-layout__icon-btn" aria-label="Notifications">
            <IconBell size={20} stroke={1.8} />
            <span className="admin-layout__badge">3</span>
          </button>
          <div className="admin-layout__avatar" title={admin?.email}>
            {admin?.firstName?.[0]}
            {admin?.lastName?.[0]}
          </div>
          <ThemeToggle />
          <button type="button" className="admin-layout__logout" onClick={handleLogout} aria-label="Log out">
            <IconLogout size={18} stroke={1.8} />
          </button>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <div
        className={`admin-layout__drawer-overlay${drawerOpen ? " admin-layout__drawer-overlay--open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <nav
        className={`admin-layout__drawer${drawerOpen ? " admin-layout__drawer--open" : ""}`}
        aria-label="Admin navigation drawer"
      >
        <button
          type="button"
          className="admin-layout__drawer-close"
          onClick={closeDrawer}
          aria-label="Close menu"
        >
          <IconX size={20} stroke={1.8} />
        </button>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={closeDrawer}
            className={({ isActive }) =>
              `admin-layout__nav-item${isActive ? " admin-layout__nav-item--active" : ""}`
            }
          >
            <Icon size={20} stroke={1.7} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="admin-layout__main">
        {pageTitle ? (
          <div className="admin-layout__page-header">
            <div>
              <h1>{pageTitle}</h1>
              {pageSubtitle ? <p>{pageSubtitle}</p> : null}
            </div>
          </div>
        ) : null}
        {children}
      </main>

      <nav className="admin-layout__bottom-nav" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `admin-layout__nav-item${isActive ? " admin-layout__nav-item--active" : ""}`
            }
          >
            <Icon size={20} stroke={1.7} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
