import { POLICIES_HERO } from "../../data/policiesDisplay.js";

export default function PoliciesHeroSection() {
  const { titleLead, titleAccent, tagline, description, visual } = POLICIES_HERO;

  return (
    <section className="policies-hero" aria-labelledby="policies-hero-title">
      <div className="policies-hero__inner">
        <div className="policies-hero__copy">
          <h1 id="policies-hero-title" className="policies-hero__title">
            <span className="policies-hero__title-line">{titleLead}</span>
            <span className="policies-hero__title-accent">{titleAccent}</span>
          </h1>
          <p className="policies-hero__tagline">{tagline}</p>
          <p className="policies-hero__description">{description}</p>
        </div>

        <div className="policies-hero__visual">
          <img src={visual} alt="" loading="eager" decoding="async" />
        </div>
      </div>
    </section>
  );
}
