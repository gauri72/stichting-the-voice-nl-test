import { Link } from "react-router-dom";
import { FaHandshake, FaRegCalendarDays, FaUsers } from "react-icons/fa6";
import "../../styles/hero.css";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-main">
              Where Talent{" "}
              <br className="hero-mobile-break" />
              {" "}Shines,
            </span>
            <span className="hero-title-accent">
              Culture{" "}
              <br className="hero-accent-mobile-break" />
              {" "}Comes Alive.
            </span>
          </h1>

          <p className="hero-description">
            Stichting The V.O.I.C.E. NL is a Netherlands-based non-profit cultural foundation dedicated
            to international cultural exchange through music, dance, film, community engagement, and
            artistic collaboration.
          </p>

          <div className="hero-cta-group">
            <Link className="hero-button hero-button-primary hero-button-explore" to="/events">
              <span className="hero-button-icon" aria-hidden="true">
                <FaRegCalendarDays />
              </span>
              Explore Our Events
            </Link>
            <Link className="hero-button hero-button-secondary hero-button-membership" to="/membership">
              <span className="hero-button-icon" aria-hidden="true">
                <FaUsers />
              </span>
              Join Membership
            </Link>
            <Link className="hero-button hero-button-outline hero-button-sponsor" to="/sponsorship">
              <span className="hero-button-icon" aria-hidden="true">
                <FaHandshake />
              </span>
              Become A Sponsor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
