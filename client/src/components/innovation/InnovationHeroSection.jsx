import { INNOVATION_HERO } from "../../data/innovationDisplay.js";

export default function InnovationHeroSection() {
  const { titleLead, titleAccent, description, visual } = INNOVATION_HERO;

  return (
    <section className="innovation-hero" aria-labelledby="innovation-hero-title">
      <div className="innovation-hero__inner">
        <div className="innovation-hero__copy">
          <h1 id="innovation-hero-title" className="innovation-hero__title">
            {titleLead} <span className="innovation-accent--cyan">{titleAccent}</span>
          </h1>
          <p className="innovation-hero__description">{description}</p>
        </div>

        <div className="innovation-hero__visual">
          <img src={visual} alt="" loading="eager" decoding="async" />
        </div>
      </div>
    </section>
  );
}
