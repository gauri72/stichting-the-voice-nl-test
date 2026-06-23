import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IconTicket, IconUser, IconUserPlus } from "@tabler/icons-react";
import ThemeToggle from "./ThemeToggle.jsx";
import { useCmsHeader } from "../../hooks/useCmsPage.js";

const DEFAULT_BUY_TICKETS_URL =
  "https://www.tickettailor.com/events/stichtingthevoicenl/2185529";

const DEFAULT_NAV_ITEMS = [
  { label: "Home", to: "/", end: true },
  {
    label: "Our Pillars",
    children: [
      { label: "Experience", to: "/events" },
      { label: "Stories", to: "/stories" },
      { label: "Impact", to: "/impact" },
      { label: "Innovation", to: "/voice-venture-studio" },
    ],
  },
  {
    label: "Partner With Us",
    children: [
      { label: "Become A Member", to: "/membership" },
      { label: "Sponsor Us", to: "/sponsorship" },
      { label: "Donate", to: "/donate" },
    ],
  },
  { label: "About Us", to: "/about-us" },
];

function cmsItemsToNav(items = []) {
  if (!items.length) return DEFAULT_NAV_ITEMS;
  return items
    .filter((item) => item.visible !== false && item.desktopVisible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => {
      if (item.children?.length) {
        return {
          label: item.label,
          children: item.children
            .filter((c) => c.visible !== false)
            .map((c) => ({ label: c.label, to: c.url || c.to || "/" })),
        };
      }
      return { label: item.label, to: item.url || item.to || "/", end: item.url === "/" };
    });
}

export default function Header() {
  const { header } = useCmsHeader();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdownLabel, setOpenDropdownLabel] = useState(null);

  const settings = header?.settings || {};
  const NAV_ITEMS = cmsItemsToNav(header?.items);
  const buyTicketsUrl = settings.buyTicketsButtonUrl || DEFAULT_BUY_TICKETS_URL;
  const memberText = settings.memberButtonText || "Become A Member";
  const memberUrl = settings.memberButtonUrl || "/membership";
  const buyTicketsText = settings.buyTicketsButtonText || "Buy Tickets";
  const loginText = settings.loginButtonText || "Log In Or Sign Up";
  const loginUrl = settings.loginButtonUrl || "/my-account";
  const showThemeToggle = settings.themeToggleVisible !== false;
  const stickyClass = settings.stickyHeader !== false ? " site-header--sticky" : "";
  const announcement = header?.announcementBar;

  function closeMenu() {
    setIsMenuOpen(false);
    setOpenDropdownLabel(null);
  }

  function handleDropdownToggle(label) {
    setOpenDropdownLabel((prev) => (prev === label ? null : label));
  }

  const navLinks = (
    <>
      {NAV_ITEMS.map((item) => {
        if (!item.children) {
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenu}>
              {item.label}
            </NavLink>
          );
        }

        return (
          <div
            key={item.label}
            className={`menu-dropdown ${openDropdownLabel === item.label ? "open" : ""}`.trim()}
          >
            <button
              type="button"
              className="menu-dropdown-trigger"
              onClick={() => handleDropdownToggle(item.label)}
              aria-expanded={openDropdownLabel === item.label}
            >
              {item.label}
            </button>
            <div className="menu-dropdown-menu">
              {item.children.map((child) => (
                <NavLink key={child.to} to={child.to} onClick={closeMenu}>
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );

  const memberCta = (
    <Link
      className="donate-button nav-toolbar__cta-member dash-welcome__badge"
      to={memberUrl}
      onClick={closeMenu}
    >
      <IconUserPlus className="nav-toolbar__cta-icon dash-welcome__badge-icon" aria-hidden stroke={1.75} />
      <span>{memberText}</span>
    </Link>
  );

  const buyTicketsCta = (
    <a
      className="donate-button buy-tickets-button dash-welcome__badge"
      href={buyTicketsUrl}
      target={settings.buyTicketsOpenNewTab !== false ? "_blank" : "_self"}
      rel="noopener noreferrer"
      onClick={closeMenu}
      aria-label="Buy tickets on Ticket Tailor"
    >
      <IconTicket className="nav-toolbar__cta-icon dash-welcome__badge-icon buy-tickets-icon" aria-hidden stroke={1.75} />
      <span>{buyTicketsText}</span>
    </a>
  );

  const authCta = (
    <Link
      className="donate-button auth-button nav-toolbar__cta-auth dash-welcome__badge"
      to={loginUrl}
      onClick={closeMenu}
    >
      <IconUser className="nav-toolbar__cta-icon dash-welcome__badge-icon auth-button-icon" aria-hidden stroke={1.75} />
      <span>{loginText}</span>
    </Link>
  );

  return (
    <header className={`site-header${stickyClass}`}>
      {announcement?.visible && announcement.text ? (
        <div className="site-header__announcement">
          {announcement.url ? <a href={announcement.url}>{announcement.text}</a> : announcement.text}
        </div>
      ) : null}
      <nav className="site-navbar" aria-label="Main">
        <div className="nav-toolbar">
          <div className="menu-links menu-links--desktop">{navLinks}</div>
          {memberCta}
          {buyTicketsCta}
          {authCta}
          {showThemeToggle ? <ThemeToggle /> : null}
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`nav-actions ${isMenuOpen ? "open" : ""}`}>
          <button className="menu-close" type="button" aria-label="Close navigation menu" onClick={closeMenu}>
            <span />
            <span />
          </button>

          <div className="menu-links menu-links--mobile">{navLinks}</div>
        </div>
      </nav>
    </header>
  );
}
