import { FaArrowRightLong } from "react-icons/fa6";
import heroBackground from "../../assets/Sponsorship/breadcrumb-bg.png";
import "../../styles/sponsorship-breadcrumb-section.css";

export default function SponsorshipBreadcrumbSection() {
  return (
    <section
      className="sponsorship-page-hero"
      aria-labelledby="sponsorship-hero-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="sponsorship-page-hero__container">
        <h1 id="sponsorship-hero-title">
          <span className="sponsorship-page-hero__title-line">Partner With Us.</span>
          <span className="sponsorship-page-hero__title-gradient">Create Lasting Impact.</span>
        </h1>

        <p className="sponsorship-page-hero__intro">
          Sponsorship with Stichting The V.O.I.C.E. NL connects your brand with diverse communities,
          promotes cultural exchange, and supports impactful events that inspire and unite.
        </p>

        <div className="sponsorship-page-hero__actions">
          <a className="sponsorship-page-hero__cta sponsorship-page-hero__cta--primary" href="#sponsorship-tiers">
            Become A Sponsor
            <FaArrowRightLong aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
