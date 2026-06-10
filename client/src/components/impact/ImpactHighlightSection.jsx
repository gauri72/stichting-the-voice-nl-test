import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconHeartHandshake,
  IconSpeakerphone,
  IconSparkles,
  IconUsersGroup,
} from "@tabler/icons-react";
import { IMPACT_HIGHLIGHT } from "../../data/impactDisplay.js";

const FEATURE_ICONS = {
  empower: IconUsersGroup,
  support: IconHeartHandshake,
  advocate: IconSpeakerphone,
};

export default function ImpactHighlightSection() {
  const { label, title, description, image, linkLabel, linkTo, features } = IMPACT_HIGHLIGHT;

  return (
    <section className="impact-highlight" aria-labelledby="impact-highlight-title">
      <div className="impact-highlight__label">
        <IconSparkles size={16} stroke={1.8} aria-hidden />
        {label}
      </div>

      <div className="impact-highlight__grid">
        <article className="impact-highlight__card">
          <div className="impact-highlight__card-media">
            <img src={image} alt={title} loading="lazy" />
          </div>
          <div className="impact-highlight__card-body">
            <h2 id="impact-highlight-title" className="impact-highlight__card-title">
              {title}
            </h2>
            <p className="impact-highlight__card-text">{description}</p>
            <Link to={linkTo} className="impact-highlight__card-link">
              {linkLabel}
              <IconArrowRight size={16} stroke={2} aria-hidden />
            </Link>
          </div>
        </article>

        <div className="impact-highlight__features" role="list">
          {features.map(({ key, title: featureTitle, description: featureText }) => {
            const Icon = FEATURE_ICONS[key] || IconUsersGroup;

            return (
              <div key={key} className="impact-highlight__feature" role="listitem">
                <span className="impact-highlight__feature-icon" aria-hidden="true">
                  <Icon size={24} stroke={1.6} />
                </span>
                <div>
                  <h3 className="impact-highlight__feature-title">{featureTitle}</h3>
                  <p className="impact-highlight__feature-text">{featureText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
