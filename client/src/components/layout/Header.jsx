import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoPersonOutline } from "react-icons/io5";
import headerLogo from "../../assets/header-logo.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  function closeMenu() {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }

  function toggleDropdown(key) {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }

  const navLinks = (
    <>
      <NavLink to="/" end onClick={closeMenu}>
        Home
      </NavLink>
      <NavLink to="/membership" onClick={closeMenu}>
        Membership
      </NavLink>
      <NavLink to="/events" onClick={closeMenu}>
        Events
      </NavLink>
      <NavLink to="/sponsorship" onClick={closeMenu}>
        Sponsorship
      </NavLink>

      <div className={`menu-dropdown ${openDropdown === "more" ? "open" : ""}`}>
        <button
          className="menu-dropdown-trigger"
          type="button"
          aria-haspopup="true"
          aria-expanded={openDropdown === "more"}
          onClick={() => toggleDropdown("more")}
        >
          More
        </button>
        <div className="menu-dropdown-menu">
          <NavLink to="/segments/vision-of-sounds" onClick={closeMenu}>
            Vision of Sounds
          </NavLink>
          <NavLink to="/segments/vownl" onClick={closeMenu}>
            VOWNL
          </NavLink>
          <NavLink to="/segments/voice-of-visionaries" onClick={closeMenu}>
            Voice of Visionaries
          </NavLink>
          <NavLink to="/voice-venture-studio" onClick={closeMenu}>
            VOICE Venture Studio
          </NavLink>
          <NavLink to="/terms-and-conditions" onClick={closeMenu}>
            Policy &amp; Conditions
          </NavLink>
        </div>
      </div>

      <NavLink className="nav-contact-link" to="/contact" onClick={closeMenu}>
        Contact us
      </NavLink>
    </>
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

          <Link className="donate-button donate-button-menu" to="/donate" onClick={closeMenu}>
            <span className="donate-icon">♥</span>
            Donate Now
          </Link>

          <Link className="auth-button auth-button-menu" to="/my-account" onClick={closeMenu}>
            <IoPersonOutline className="auth-button-icon" aria-hidden />
            <span>LOG IN or SIGN UP</span>
          </Link>
        </div>

        <div className="nav-right">
          <Link className="donate-button donate-button-desktop" to="/donate" onClick={closeMenu}>
            <span className="donate-icon">♥</span>
            Donate Now
          </Link>

          <Link className="auth-button auth-button-desktop" to="/my-account" onClick={closeMenu}>
            <IoPersonOutline className="auth-button-icon" aria-hidden />
            <span>LOG IN or SIGN UP</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
