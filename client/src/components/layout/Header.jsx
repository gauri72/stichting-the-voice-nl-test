import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconTicket, IconUser, IconUserCheck, IconUserPlus } from "@tabler/icons-react";
import ThemeToggle from "./ThemeToggle.jsx";
import { useCmsHeader } from "../../hooks/useCmsPage.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { translateKnownLabel, translateKnownNavLabel } from "../../i18n/navLabels.js";

const DEFAULT_BUY_TICKETS_URL =
  "https://www.tickettailor.com/events/stichtingthevoicenl/2185529";

function buildDefaultNavItems(t) {
  return [
    { label: t("common:nav.home"), to: "/", end: true },
    {
      label: t("common:nav.ourPillars"),
      children: [
        { label: t("common:nav.experience"), to: "/events" },
        { label: t("common:nav.stories"), to: "/stories" },
        { label: t("common:nav.impact"), to: "/impact" },
        { label: t("common:nav.innovation"), to: "/voice-venture-studio" },
      ],
    },
    {
      label: t("common:nav.partnerWithUs"),
      children: [
        { label: t("common:nav.becomeMember"), to: "/membership" },
        { label: t("common:nav.sponsorUs"), to: "/sponsorship" },
        { label: t("common:nav.donate"), to: "/donate" },
      ],
    },
    { label: t("common:nav.aboutUs"), to: "/about-us" },
  ];
}

function cmsItemsToNav(items = [], defaultNavItems, t) {
  if (!items.length) return defaultNavItems;
  return items
    .filter((item) => item.visible !== false && item.desktopVisible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => {
      if (item.children?.length) {
        return {
          label: translateKnownLabel(item.label, t),
          children: item.children
            .filter((c) => c.visible !== false)
            .map((c) => {
              const to = c.url || c.to || "/";
              return { label: translateKnownNavLabel(to, c.label, t), to };
            }),
        };
      }
      const to = item.url || item.to || "/";
      return { label: translateKnownNavLabel(to, item.label, t), to, end: to === "/" };
    });
}

export default function Header() {
  const { t } = useTranslation(["common"]);
  const { header } = useCmsHeader();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdownLabel, setOpenDropdownLabel] = useState(null);

  const settings = header?.settings || {};
  const NAV_ITEMS = cmsItemsToNav(header?.items, buildDefaultNavItems(t), t);
  const buyTicketsUrl = settings.buyTicketsButtonUrl || DEFAULT_BUY_TICKETS_URL;
  const memberText = translateKnownLabel(settings.memberButtonText, t) || t("common:nav.becomeMember");
  const memberUrl = settings.memberButtonUrl || "/membership";
  const buyTicketsText = translateKnownLabel(settings.buyTicketsButtonText, t) || t("common:header.buyTickets");
  const loginText = translateKnownLabel(settings.loginButtonText, t) || t("common:header.logInSignUp");
  const loginUrl = settings.loginButtonUrl || "/my-account";
  const accountText = isAuthenticated && user?.firstName ? user.firstName : t("common:header.myAccount");
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

  const authCta = isAuthenticated ? (
    <Link
      className="donate-button auth-button auth-button--active nav-toolbar__cta-auth dash-welcome__badge"
      to="/dashboard"
      onClick={closeMenu}
    >
      <IconUserCheck className="nav-toolbar__cta-icon dash-welcome__badge-icon auth-button-icon" aria-hidden stroke={1.75} />
      <span>{accountText}</span>
    </Link>
  ) : (
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
