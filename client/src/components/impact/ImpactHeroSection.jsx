import { IMPACT_HERO } from "../../data/impactDisplay.js";

export default function ImpactHeroSection() {
  const { titleLead, titleAccent, lines, background } = IMPACT_HERO;

  return (
    <section className="impact-hero" aria-labelledby="impact-hero-title">
      <img className="impact-hero__bg" src={background} alt="" aria-hidden="true" decoding="async" />
      <div className="impact-hero__overlay" aria-hidden="true" />

      <div className="impact-hero__inner">
        <div className="impact-hero__copy">
          <h1 id="impact-hero-title" className="impact-hero__title">
            {titleLead} <span className="impact-accent--teal">{titleAccent}</span>
          </h1>
          {lines.map((line) => (
            <p key={line} className="impact-hero__line">
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
