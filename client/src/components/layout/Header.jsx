import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import headerLogo from "../../assets/header-logo.png";
import "../../styles/header.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="site-navbar">
        <Link className="brand-block" to="/" aria-label="Go to home page" onClick={closeMenu}>
          <img className="brand-logo" src={headerLogo} alt="Stichting The V.O.I.C.E. NL logo" />
          <div className="brand-name">
            <p className="brand-name-top">STICHTING</p>
            <p className="brand-name-bottom">THE V.O.I.C.E. NL</p>
          </div>
        </Link>

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
              <p className="brand-name-bottom">THE V.O.I.C.E. NL</p>
            </div>
          </Link>

          <div className="menu-links">
            <NavLink to="/" end onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/about" onClick={closeMenu}>
              About Us
            </NavLink>
            <NavLink to="/events" onClick={closeMenu}>
              Events
            </NavLink>
            <NavLink to="/sponsorship" onClick={closeMenu}>
              Sponsorship
            </NavLink>
            <NavLink to="/membership" onClick={closeMenu}>
              Membership
            </NavLink>
            <NavLink to="/contact" onClick={closeMenu}>
              Contact
            </NavLink>
          </div>

          <button className="donate-button" type="button" onClick={closeMenu}>
            <span className="donate-icon">♥</span>
            Donate Now
          </button>
        </div>
      </nav>
    </header>
  );
}
