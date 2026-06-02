import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoPersonOutline, IoTicketOutline } from "react-icons/io5";
import headerLogo from "../../assets/header-logo.png";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { label: "Home", to: "/", end: true },
  {
    label: "Our Pillars",
    children: [
      { label: "Experience", to: "/events" },
      { label: "Stories", to: "/segments/vision-of-sounds" },
      { label: "Impact", to: "/segments/vownl" },
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

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdownLabel, setOpenDropdownLabel] = useState(null);

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

  const buyTicketsCta = (extraClass = "") => (
    <Link
      className={`donate-button buy-tickets-button ${extraClass}`.trim()}
      to="/#upcoming-events"
      onClick={closeMenu}
    >
      <IoTicketOutline className="buy-tickets-icon" aria-hidden />
      <span>Buy Tickets</span>
    </Link>
  );

  const authCta = (extraClass = "") => (
    <Link className={`auth-button ${extraClass}`.trim()} to="/my-account" onClick={closeMenu}>
      <IoPersonOutline className="auth-button-icon" aria-hidden />
      <span>LOG IN or SIGN UP</span>
    </Link>
  );

  return (
    <header className="site-header">
      <nav className="site-navbar">
        <Link className="brand-block" to="/" aria-label="Go to home page" onClick={closeMenu}>
          <img className="brand-logo" src={headerLogo} alt="Stichting The V.O.I.C.E. NL logo" />
          <div className="brand-name">
            <p className="brand-name-top">STICHTING</p>
            <p className="brand-name-bottom">
              THE V<span className="brand-tight-v-period">.</span>O.I.C.E. NL
            </p>
          </div>
        </Link>

        <div className="nav-center">
          <div className="menu-links">{navLinks}</div>
        </div>

        <div className="nav-mobile-bar">
          {buyTicketsCta("buy-tickets-bar")}
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

          <Link className="mobile-brand-block" to="/" aria-label="Go to home page" onClick={closeMenu}>
            <img className="mobile-brand-logo" src={headerLogo} alt="Stichting The V.O.I.C.E. NL logo" />
            <div className="mobile-brand-name">
              <p className="brand-name-top">STICHTING</p>
              <p className="brand-name-bottom">
                THE V<span className="brand-tight-v-period">.</span>O.I.C.E. NL
              </p>
            </div>
          </Link>

          <div className="menu-links menu-links--mobile">{navLinks}</div>

          {authCta("auth-button-menu")}

          <div className="nav-actions-theme-wrap">
            <ThemeToggle className="theme-toggle--mobile" />
          </div>
        </div>

        <div className="nav-right">
          {buyTicketsCta("donate-button-desktop")}
          {authCta("auth-button-desktop")}
          <ThemeToggle className="theme-toggle--desktop" />
        </div>
      </nav>
    </header>
  );
}
