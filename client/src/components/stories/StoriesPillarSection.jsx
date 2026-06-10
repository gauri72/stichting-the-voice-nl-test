import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconMicrophone,
  IconMusic,
  IconPlayerPlayFilled,
} from "@tabler/icons-react";

const ICON_MAP = {
  music: IconMusic,
  microphone: IconMicrophone,
};

export default function StoriesPillarSection({ pillar }) {
  const {
    id,
    accent,
    icon,
    logo,
    label,
    titleLineOne,
    titleLineTwo,
    description,
    featured,
    cards,
    viewAllLabel,
    viewAllTo,
  } = pillar;

  const Icon = ICON_MAP[icon] || IconMusic;

  return (
    <section
      id={id}
      className={`stories-pillar stories-pillar--${accent}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="stories-pillar__inner">
        <div className="stories-pillar__top">
          <div className="stories-pillar__intro">
            <span
              className={`stories-pillar__icon${
                logo ? " stories-pillar__icon--logo" : ""
              }`}
              aria-hidden="true"
            >
              {logo ? (
                <img src={logo} alt="" />
              ) : (
                <Icon size={24} stroke={1.8} />
              )}
            </span>
            <span className="stories-pillar__label">{label}</span>
            <h2 id={`${id}-title`} className="stories-pillar__title">
              {titleLineOne}
              <br />
              {titleLineTwo}
            </h2>
            <p className="stories-pillar__description">{description}</p>
          </div>

          <article className="stories-pillar__featured">
            <div className="stories-pillar__featured-media">
              <img src={featured.image} alt={featured.title} loading="lazy" />
              <span className="stories-pillar__badge">{featured.badge}</span>
            </div>
            <div className="stories-pillar__featured-body">
              <h3 className="stories-pillar__featured-title">{featured.title}</h3>
              <p className="stories-pillar__featured-text">{featured.description}</p>
              <Link to={featured.ctaTo} className="stories-pillar__watch">
                <span className="stories-pillar__watch-icon" aria-hidden="true">
                  <IconPlayerPlayFilled size={14} />
                </span>
                {featured.ctaLabel}
              </Link>
            </div>
          </article>
        </div>

        <div className="stories-pillar__grid" role="list">
          {cards.map(({ title, description: cardText, image, accent: cardAccent, imageFit }) => (
            <article
              key={title}
              className={`stories-card stories-card--${cardAccent}${
                imageFit === "contain" ? " stories-card--logo" : ""
              }`}
              role="listitem"
            >
              <div className="stories-card__media">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  className={imageFit === "contain" ? "stories-card__image--contain" : undefined}
                />
              </div>
              <div className="stories-card__body">
                <h4 className="stories-card__title">{title}</h4>
                <p className="stories-card__text">{cardText}</p>
                <span className="stories-card__bar" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>

        <div className="stories-pillar__view-all-wrap">
          <Link to={viewAllTo} className="stories-pillar__view-all">
            {viewAllLabel}
            <IconArrowRight size={16} stroke={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
