import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const PILLAR_I18N_KEYS = {
  "stories-vision-of-sounds": "visionOfSounds",
  "stories-voice-of-visionaries": "voiceOfVisionaries",
};

export default function StoriesPillarSection({ pillar }) {
  const { t } = useTranslation(["stories"]);
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
  const i18nKey = PILLAR_I18N_KEYS[id];

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
            <span className="stories-pillar__label">{i18nKey ? t(`stories:${i18nKey}.label`) : label}</span>
            <h2 id={`${id}-title`} className="stories-pillar__title">
              {i18nKey ? t(`stories:${i18nKey}.titleLineOne`) : titleLineOne}
              <br />
              {i18nKey ? t(`stories:${i18nKey}.titleLineTwo`) : titleLineTwo}
            </h2>
            <p className="stories-pillar__description">{i18nKey ? t(`stories:${i18nKey}.description`) : description}</p>
          </div>

          <article className="stories-pillar__featured">
            <div className="stories-pillar__featured-media">
              <img src={featured.image} alt={featured.title} loading="lazy" />
              <span className="stories-pillar__badge">{i18nKey ? t(`stories:${i18nKey}.featured.badge`) : featured.badge}</span>
            </div>
            <div className="stories-pillar__featured-body">
              <h3 className="stories-pillar__featured-title">
                {i18nKey ? t(`stories:${i18nKey}.featured.title`) : featured.title}
              </h3>
              <p className="stories-pillar__featured-text">
                {i18nKey ? t(`stories:${i18nKey}.featured.description`) : featured.description}
              </p>
              <Link to={featured.ctaTo} className="stories-pillar__watch">
                <span className="stories-pillar__watch-icon" aria-hidden="true">
                  <IconPlayerPlayFilled size={14} />
                </span>
                {i18nKey ? t(`stories:${i18nKey}.featured.ctaLabel`) : featured.ctaLabel}
              </Link>
            </div>
          </article>
        </div>

        <div className="stories-pillar__grid" role="list">
          {cards.map(({ title, description: cardText, image, accent: cardAccent, imageFit }, index) => {
            const cardKey = `card${index + 1}`;
            return (
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
                  <h4 className="stories-card__title">{i18nKey ? t(`stories:${i18nKey}.${cardKey}.title`) : title}</h4>
                  <p className="stories-card__text">{i18nKey ? t(`stories:${i18nKey}.${cardKey}.description`) : cardText}</p>
                  <span className="stories-card__bar" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>

        <div className="stories-pillar__view-all-wrap">
          <Link to={viewAllTo} className="stories-pillar__view-all">
            {i18nKey ? t(`stories:${i18nKey}.viewAllLabel`) : viewAllLabel}
            <IconArrowRight size={16} stroke={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
