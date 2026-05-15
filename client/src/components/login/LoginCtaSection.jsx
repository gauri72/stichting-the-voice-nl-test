import { Link } from "react-router-dom";
import { FaHandshake, FaStar } from "react-icons/fa";
import ctaBackground from "../../assets/Log In/cta-bg.jpg";
import "../../styles/login-cta-section.css";

export default function LoginCtaSection() {
  return (
    <section className="login-cta-section" aria-labelledby="login-cta-title">
      <div
        className="login-cta-section__panel"
        style={{ backgroundImage: `url(${ctaBackground})` }}
      >
        <div className="login-cta-section__copy">
          <h2 id="login-cta-title" className="login-cta-section__title">
            Make an Even Bigger Impact
          </h2>
          <p className="login-cta-section__description">
            Join our community or upgrade your membership to unlock more opportunities and make a
            difference.
          </p>
        </div>

        <div className="login-cta-section__actions">
          <Link className="login-cta-section__btn login-cta-section__btn--primary" to="/membership">
            <FaStar aria-hidden />
            Upgrade Membership
          </Link>
          <Link className="login-cta-section__btn login-cta-section__btn--secondary" to="/sponsorship">
            <FaHandshake aria-hidden />
            Become a Sponsor
          </Link>
        </div>
      </div>
    </section>
  );
}
