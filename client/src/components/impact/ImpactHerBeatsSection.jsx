import { IconArrowRight, IconBrandWhatsapp, IconHeart } from "@tabler/icons-react";
import { IMPACT_HERBEATS } from "../../data/impactDisplay.js";

export default function ImpactHerBeatsSection() {
  const {
    logo,
    brandName,
    brandTagline,
    brandMotto,
    title,
    description,
    quote,
    sideImage,
    cta,
  } = IMPACT_HERBEATS;

  return (
    <section className="impact-herbeats" aria-labelledby="impact-herbeats-title">
      <div className="impact-herbeats__card">
        <div className="impact-herbeats__grid">
          <div className="impact-herbeats__brand">
            <img className="impact-herbeats__logo" src={logo} alt={brandName} loading="lazy" />
            <p className="impact-herbeats__brand-name">{brandName}</p>
            <p className="impact-herbeats__brand-tagline">{brandTagline}</p>
            <p className="impact-herbeats__brand-motto">{brandMotto}</p>
          </div>

          <div className="impact-herbeats__content">
            <h2 id="impact-herbeats-title" className="impact-herbeats__title">
              {title}
            </h2>
            <p className="impact-herbeats__description">{description}</p>
            <p className="impact-herbeats__quote">
              <IconHeart className="impact-herbeats__quote-icon" size={16} stroke={1.8} aria-hidden />
              {quote}
            </p>
          </div>

          <div className="impact-herbeats__media">
            <img src={sideImage} alt="Women celebrating at a HerBeats event" loading="lazy" />
          </div>
        </div>

        <a
          className="impact-herbeats__cta"
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="impact-herbeats__cta-icon" aria-hidden="true">
            <IconBrandWhatsapp size={22} stroke={1.6} />
          </span>
          <span className="impact-herbeats__cta-text">
            <span className="impact-herbeats__cta-title">{cta.title}</span>
            <span className="impact-herbeats__cta-subtitle">{cta.subtitle}</span>
          </span>
          <IconArrowRight className="impact-herbeats__cta-arrow" size={18} stroke={2} aria-hidden />
        </a>
      </div>
    </section>
  );
}
