import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  IconBell,
  IconChartBar,
  IconLayoutDashboard,
  IconLogout,
  IconMail,
  IconMenu2,
  IconTicket,
  IconUpload,
  IconUsers,
  IconUser,
  IconX,
  IconChevronDown,
  IconDiscount,
  IconHeartHandshake,
  IconHeart,
  IconReportMoney,
  IconReceipt,
  IconFileInvoice,
  IconArrowsExchange,
  IconShieldCheck,
  IconSettings,
  IconWorld,
  IconLayoutGrid,
  IconUsersGroup,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import ThemeToggle from "../layout/ThemeToggle.jsx";
import "../../styles/admin-layout.css";
import "../../styles/admin-mobile.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard, end: true },
  { to: "/admin/dashboard-builder", label: "Dashboard Builder", icon: IconLayoutGrid },
  { to: "/admin/customer-dashboard-builder", label: "Customer Dashboard Builder", icon: IconUsersGroup },
  { to: "/admin/events", label: "Events", icon: IconTicket },
  { to: "/admin/sessions", label: "Sessions", icon: IconCalendarEvent },
  { to: "/admin/session-calendar", label: "Session Calendar", icon: IconCalendarEvent },
  { to: "/admin/session-bookings", label: "Session Bookings", icon: IconCalendarEvent },
  { to: "/admin/resources", label: "Resources", icon: IconCalendarEvent },
  { to: "/admin/rsvps", label: "RSVPs", icon: IconCalendarEvent },
  { to: "/admin/tickets", label: "Tickets", icon: IconTicket },
  { to: "/admin/check-in", label: "Check-in", icon: IconTicket },
  { to: "/admin/memberships", label: "Memberships", icon: IconUsers },
  { to: "/admin/users", label: "Users", icon: IconUser },
  { to: "/admin/templates", label: "Templates", icon: IconUpload },
  { to: "/admin/discounts", label: "Discounts", icon: IconDiscount },
  { to: "/admin/sponsorships", label: "Sponsorships", icon: IconHeartHandshake },
  { to: "/admin/donations", label: "Donations", icon: IconHeart },
  {
    label: "Finance & Audit",
    icon: IconReportMoney,
    basePath: "/admin/finance",
    children: [
      { to: "/admin/finance/invoices", label: "Invoices", icon: IconFileInvoice },
      { to: "/admin/finance/event-budgets", label: "Event Budgets", icon: IconChartBar },
      { to: "/admin/finance/transactions", label: "Transactions", icon: IconArrowsExchange },
      { to: "/admin/finance/audit-reports", label: "Audit Reports", icon: IconShieldCheck },
      { to: "/admin/finance/reports", label: "Financial Reports", icon: IconReceipt },
      { to: "/admin/finance/settings", label: "Settings", icon: IconSettings },
    ],
  },
  { to: "/admin/vouchers", label: "Vouchers", icon: IconDiscount },
  { to: "/admin/communication", label: "Communication", icon: IconMail },
  { to: "/admin/pages", label: "Website Pages", icon: IconWorld },
  { to: "/admin/settings", label: "Settings", icon: IconSettings },
  { to: "/admin/reports", label: "Reports", icon: IconChartBar },
];

const MOBILE_NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard, end: true },
  { to: "/admin/events", label: "Events", icon: IconTicket },
  { to: "/admin/tickets", label: "Tickets", icon: IconTicket },
  { to: "/admin/memberships", label: "Members", icon: IconUsers },
  { type: "menu", label: "Menu", icon: IconMenu2 },
];

export default function AdminLayout({ children, pageTitle, pageSubtitle, hideBottomNav = false }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(() => location.pathname.startsWith("/admin/finance"));

  function closeDrawer() {
    setDrawerOpen(false);
  }

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  function renderNavItem(item, onClick) {
    if (item.children) {
      const isGroupActive = location.pathname.startsWith(item.basePath);
      return (
        <div key={item.label} className="admin-layout__nav-group">
          <button
            type="button"
            className={`admin-layout__nav-item admin-layout__nav-group-btn${isGroupActive ? " admin-layout__nav-item--active" : ""}`}
            onClick={() => setFinanceOpen((o) => !o)}
            aria-expanded={financeOpen}
          >
            <item.icon size={20} stroke={1.7} aria-hidden />
            <span>{item.label}</span>
            <IconChevronDown size={14} className={`admin-layout__nav-chevron${financeOpen ? " admin-layout__nav-chevron--open" : ""}`} />
          </button>
          {financeOpen ? (
            <div className="admin-layout__nav-sub">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  onClick={onClick}
                  className={({ isActive }) =>
                    `admin-layout__nav-subitem${isActive ? " admin-layout__nav-subitem--active" : ""}`
                  }
                >
                  <child.icon size={16} stroke={1.7} aria-hidden />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) =>
          `admin-layout__nav-item${isActive ? " admin-layout__nav-item--active" : ""}`
        }
      >
        <Icon size={20} stroke={1.7} aria-hidden />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div className={`admin-layout${hideBottomNav ? " admin-layout--no-bottom-nav" : ""}${drawerOpen ? " admin-layout--drawer-open" : ""}`}>
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
            <span className="admin-layout__brand-line admin-layout__brand-line--top">Stichting</span>
            <span className="admin-layout__brand-line admin-layout__brand-line--bottom">The V.O.I.C.E. NL</span>
          </div>
        </div>

        <div className="admin-layout__actions">
          <button type="button" className="admin-layout__icon-btn" aria-label="Notifications">
            <IconBell size={20} stroke={1.8} />
            <span className="admin-layout__badge">3</span>
          </button>
          <button
            type="button"
            className="admin-layout__profile-btn"
            aria-label="Account menu"
            title={admin?.email}
          >
            <span className="admin-layout__avatar">
              {admin?.firstName?.[0]}
              {admin?.lastName?.[0]}
            </span>
            <IconChevronDown size={14} stroke={2} className="admin-layout__profile-chevron" aria-hidden />
          </button>
          <ThemeToggle className="admin-layout__theme-toggle" />
          <button type="button" className="admin-layout__icon-btn" onClick={handleLogout} aria-label="Log out">
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
        aria-hidden={!drawerOpen}
      >
        <div className="admin-layout__drawer-header">
          <span className="admin-layout__drawer-title">Admin Menu</span>
          <button
            type="button"
            className="admin-layout__drawer-close"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>
        <div className="admin-layout__drawer-nav">
          {NAV_ITEMS.map((item) => renderNavItem(item, closeDrawer))}
        </div>
        <div className="admin-layout__drawer-footer">
          <button type="button" className="admin-layout__drawer-logout" onClick={handleLogout}>
            <IconLogout size={18} stroke={1.8} />
            Log out
          </button>
        </div>
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

      {!hideBottomNav ? (
        <nav className="admin-layout__bottom-nav admin-layout__bottom-nav--mobile" aria-label="Admin navigation">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.type === "menu") {
              return (
                <button
                  key="menu"
                  type="button"
                  className="admin-layout__nav-item admin-layout__nav-item--menu"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open admin menu"
                >
                  <Icon size={20} stroke={1.7} aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-layout__nav-item${isActive ? " admin-layout__nav-item--active" : ""}`
                }
              >
                <Icon size={20} stroke={1.7} aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      ) : null}

      <nav className="admin-layout__bottom-nav admin-layout__bottom-nav--desktop" aria-label="Admin sidebar">
        {NAV_ITEMS.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
