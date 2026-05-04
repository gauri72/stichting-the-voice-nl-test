import { FaUsers } from "react-icons/fa6";
import heroBackground from "../../assets/membership/hero-bg.png";
import "../../styles/membership-breadcrumb-section.css";

export default function MembershipBreadcrumbSection() {
  return (
    <section
      className="membership-page"
      aria-labelledby="membership-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="membership-page__container">
        <h1 id="membership-title">
          <span className="membership-page__title-line">Be Part of a Global</span>
          <span className="membership-page__title-gradient">Cultural Movement</span>
        </h1>
        <p className="membership-page__intro">
          Join Stichting The V.O.I.C.E. NL and become part of a diverse community that believes in
          the power of culture, creativity, and collaboration to build a better tomorrow.
        </p>
        <div className="membership-page__actions">
          <a className="membership-page__cta membership-page__cta--primary" href="mailto:info@Stichtingthevoice.nl">
            <FaUsers aria-hidden />
            Join Membership
          </a>
          <a className="membership-page__cta membership-page__cta--secondary" href="#membership-faqs">
            Membership FAQs
          </a>
        </div>
      </div>
    </section>
  );
}
