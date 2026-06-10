import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconChartBar,
  IconCheck,
  IconRocket,
  IconUsersGroup,
} from "@tabler/icons-react";
import { INNOVATION_INITIATIVES } from "../../data/innovationDisplay.js";

const INITIATIVE_ICONS = {
  rocket: IconRocket,
  people: IconUsersGroup,
  chart: IconChartBar,
};

export default function InnovationInitiativesSection() {
  return (
    <section className="innovation-initiatives" aria-labelledby="innovation-initiatives-title">
      <h2 id="innovation-initiatives-title" className="innovation-section-title">
        Our Key Initiatives
      </h2>

      <div className="innovation-initiatives__grid">
        {INNOVATION_INITIATIVES.map(
          ({
            key,
            accent,
            icon,
            logo,
            title,
            tagline,
            description,
            items,
            buttonLabel,
            buttonTo,
            buttonHref,
            buttonStyle,
          }) => {
            const Icon = INITIATIVE_ICONS[icon] || IconRocket;

            return (
              <article
                key={key}
                className={`innovation-initiative-card innovation-initiative-card--${accent}`}
              >
                <span className="innovation-initiative-card__icon" aria-hidden="true">
                  <Icon size={24} stroke={1.6} />
                </span>

                {logo ? (
                  <img
                    className="innovation-initiative-card__logo"
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />
                ) : null}

                <h3 className="innovation-initiative-card__title">{title}</h3>
                <p className="innovation-initiative-card__tagline">{tagline}</p>
                <p className="innovation-initiative-card__description">{description}</p>

                <ul className="innovation-initiative-card__list">
                  {items.map((item) => (
                    <li key={item}>
                      <IconCheck size={16} stroke={2.2} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                {buttonStyle === "whatsapp" ? (
                  <a
                    className="innovation-initiative-card__button innovation-initiative-card__button--whatsapp"
                    href={buttonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandWhatsapp size={18} stroke={1.6} aria-hidden />
                    {buttonLabel}
                    <IconArrowRight size={16} stroke={2} aria-hidden />
                  </a>
                ) : buttonHref ? (
                  <a
                    href={buttonHref}
                    className="innovation-initiative-card__button innovation-initiative-card__button--outline"
                  >
                    {buttonLabel}
                    <IconArrowRight size={16} stroke={2} aria-hidden />
                  </a>
                ) : (
                  <Link
                    to={buttonTo}
                    className="innovation-initiative-card__button innovation-initiative-card__button--outline"
                  >
                    {buttonLabel}
                    <IconArrowRight size={16} stroke={2} aria-hidden />
                  </Link>
                )}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}
