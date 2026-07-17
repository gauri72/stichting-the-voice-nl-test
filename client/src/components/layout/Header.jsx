import { useEffect, useState } from "react";
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
    { label: t("common:nav.events"), to: "/events" },
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
        { label: t("common:nav.sponsorUs"), to: "/sponsorship" },
        { label: t("common:nav.donate"), to: "/donate" },
        { label: "V.Commerce", to: "/vcommerce" },
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

function addPartnerWithUsNavigation(items = [], t) {
  const partnerRoutes = new Set(["/sponsorship", "/donate", "/vcommerce"]);
  const partnerItem = {
    label: t("common:nav.partnerWithUs"),
    children: [
      { label: t("common:nav.sponsorUs"), to: "/sponsorship" },
      { label: t("common:nav.donate"), to: "/donate" },
      { label: "V.Commerce", to: "/vcommerce" },
    ],
  };
  let insertionIndex = items.findIndex((item) =>
    partnerRoutes.has(item.to) ||
    item.children?.some((child) => partnerRoutes.has(child.to)) ||
    String(item.label || "").toLowerCase().includes("partner with us")
  );

  const remainingItems = items.reduce((result, item) => {
    const isPartnerGroup =
      String(item.label || "").toLowerCase().includes("partner with us") ||
      item.children?.some((child) => partnerRoutes.has(child.to));

    if (partnerRoutes.has(item.to) || isPartnerGroup) return result;
    result.push(item);
    return result;
  }, []);

  if (insertionIndex < 0) {
    const aboutIndex = remainingItems.findIndex((item) => item.to === "/about-us");
    insertionIndex = aboutIndex < 0 ? remainingItems.length : aboutIndex;
  } else {
    insertionIndex = Math.min(insertionIndex, remainingItems.length);
  }

  const normalizedItems = [
    ...remainingItems.slice(0, insertionIndex),
    partnerItem,
    ...remainingItems.slice(insertionIndex),
  ];

  if (!normalizedItems.some((item) => item.to === "/events")) {
    normalizedItems.push({ label: t("common:nav.events"), to: "/events" });
  }

  function navigationRank(item) {
    if (item.to === "/") return 0;
    if (item.to === "/events") return 1;
    if (item.children?.some((child) => ["/stories", "/impact", "/voice-venture-studio"].includes(child.to))) return 2;
    if (item.children?.some((child) => partnerRoutes.has(child.to))) return 3;
    if (item.to === "/about-us") return 5;
    return 4;
  }

  return normalizedItems
    .filter((item, index, allItems) => item.to !== "/events" || index === allItems.findIndex((candidate) => candidate.to === "/events"))
    .sort((a, b) => navigationRank(a) - navigationRank(b));
}

export default function Header() {
  const { t } = useTranslation(["common"]);
  const { header } = useCmsHeader();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdownLabel, setOpenDropdownLabel] = useState(null);

  const settings = header?.settings || {};
  const NAV_ITEMS = addPartnerWithUsNavigation(
    cmsItemsToNav(header?.items, buildDefaultNavItems(t), t),
    t
  );
  const buyTicketsUrl = settings.buyTicketsButtonUrl || DEFAULT_BUY_TICKETS_URL;
  const memberText = translateKnownLabel(settings.memberButtonText, t) || t("common:nav.becomeMember");
  const memberUrl = settings.memberButtonUrl || "/membership";
  const buyTicketsText = translateKnownLabel(settings.buyTicketsButtonText, t) || t("common:header.buyTickets");
  const loginText = translateKnownLabel(settings.loginButtonText, t) || t("common:header.logInSignUp");
  const loginUrl = settings.loginButtonUrl || "/my-account";
  const firstName = String(user?.firstName || user?.name || "").trim().split(/\s+/)[0];
  const accountText = isAuthenticated && firstName ? firstName : t("common:header.myAccount");
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

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

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
      <span className="nav-toolbar__cta-content">
        <IconUserPlus className="nav-toolbar__cta-icon dash-welcome__badge-icon" aria-hidden stroke={1.75} />
        <span>{memberText}</span>
      </span>
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
      <span className="nav-toolbar__cta-content">
        <IconTicket className="nav-toolbar__cta-icon dash-welcome__badge-icon buy-tickets-icon" aria-hidden stroke={1.75} />
        <span>{buyTicketsText}</span>
      </span>
    </a>
  );

  const authCta = isAuthenticated ? (
    <Link
      className="donate-button auth-button auth-button--active nav-toolbar__cta-auth dash-welcome__badge"
      to="/dashboard"
      onClick={closeMenu}
    >
      <span className="nav-toolbar__cta-content nav-toolbar__auth-content">
        <IconUserCheck className="nav-toolbar__cta-icon dash-welcome__badge-icon auth-button-icon" aria-hidden stroke={1.75} />
        <span>{accountText}</span>
      </span>
    </Link>
  ) : (
    <Link
      className="donate-button auth-button nav-toolbar__cta-auth dash-welcome__badge"
      to={loginUrl}
      onClick={closeMenu}
    >
      <span className="nav-toolbar__cta-content nav-toolbar__auth-content">
        <IconUser className="nav-toolbar__cta-icon dash-welcome__badge-icon auth-button-icon" aria-hidden stroke={1.75} />
        <span>{loginText}</span>
      </span>
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
          <div className="nav-toolbar__cta-group">
            {memberCta}
            {buyTicketsCta}
            {authCta}
          </div>
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

        <button
          type="button"
          className={`nav-actions-backdrop${isMenuOpen ? " open" : ""}`}
          aria-label="Close navigation menu"
          tabIndex={isMenuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <div className={`nav-actions ${isMenuOpen ? "open" : ""}`} aria-hidden={!isMenuOpen}>
          <div className="nav-actions__header">
            <strong>Menu</strong>
            <button className="menu-close" type="button" aria-label="Close navigation menu" onClick={closeMenu}>
              <span />
              <span />
            </button>
          </div>

          <div className="menu-links menu-links--mobile">{navLinks}</div>
          <div className="nav-actions__vcommerce">
            <span>V.Commerce</span>
            <Link to="/vcommerce/businesses" onClick={closeMenu}>Explore Shops</Link>
            <Link to="/vcommerce/categories" onClick={closeMenu}>Categories</Link>
            <Link to="/vcommerce/apply" onClick={closeMenu}>List Your Business</Link>
            <Link to="/dashboard" onClick={closeMenu}>My Dashboard</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
