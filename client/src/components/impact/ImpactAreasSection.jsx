import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconCheck,
  IconHeartHandshake,
  IconRocket,
  IconUsersGroup,
} from "@tabler/icons-react";
import { IMPACT_AREAS } from "../../data/impactDisplay.js";

const AREA_ICONS = {
  "heart-hands": IconHeartHandshake,
  rocket: IconRocket,
  people: IconUsersGroup,
};

export default function ImpactAreasSection() {
  return (
    <section className="impact-areas" aria-labelledby="impact-areas-title">
      <h2 id="impact-areas-title" className="impact-section-title">
        Our Areas Of Impact
      </h2>

      <div className="impact-areas__grid">
        {IMPACT_AREAS.map(
          ({
            key,
            accent,
            icon,
            titleLead,
            titleAccent,
            logo,
            description,
            background,
            items,
            buttonLabel,
            buttonTo,
            buttonHref,
            buttonStyle,
          }) => {
            const Icon = AREA_ICONS[icon] || IconUsersGroup;

            return (
              <article
                key={key}
                className={`impact-area-card impact-area-card--${accent}`}
              >
                <img
                  className="impact-area-card__bg"
                  src={background}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
                <div className="impact-area-card__overlay" aria-hidden="true" />

                <div className="impact-area-card__content">
                  <span className="impact-area-card__icon" aria-hidden="true">
                    <Icon size={24} stroke={1.6} />
                  </span>

                  <h3 className="impact-area-card__title">
                    {titleLead}
                    <span className="impact-area-card__title-accent">{titleAccent}</span>
                  </h3>

                  {logo ? (
                    <img
                      className="impact-area-card__logo"
                      src={logo}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  ) : null}

                  <p className="impact-area-card__description">{description}</p>

                  <ul className="impact-area-card__list">
                    {items.map((item) => (
                      <li key={item}>
                        <IconCheck size={16} stroke={2.2} aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {buttonStyle === "whatsapp" ? (
                    <a
                      className="impact-area-card__button impact-area-card__button--whatsapp"
                      href={buttonHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandWhatsapp size={18} stroke={1.6} aria-hidden />
                      {buttonLabel}
                      <IconArrowRight size={16} stroke={2} aria-hidden />
                    </a>
                  ) : (
                    <Link
                      to={buttonTo}
                      className="impact-area-card__button impact-area-card__button--outline"
                    >
                      {buttonLabel}
                      <IconArrowRight size={16} stroke={2} aria-hidden />
                    </Link>
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}
