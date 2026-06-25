import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconCheck,
  IconHeartHandshake,
  IconRocket,
  IconUsersGroup,
} from "@tabler/icons-react";
import { IMPACT_AREAS } from "../../data/impactDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const AREA_ICONS = {
  "heart-hands": IconHeartHandshake,
  rocket: IconRocket,
  people: IconUsersGroup,
};

export default function ImpactAreasSection() {
  const { t } = useTranslation(["impact"]);
  const overrides = useContentOverrides();

  return (
    <section className="impact-areas" aria-labelledby="impact-areas-title">
      <h2 id="impact-areas-title" className="impact-section-title">
        {resolveOverrideText(overrides.impactPageAreasHeading, "Our Areas Of Impact", t("impact:areas.heading"))}
      </h2>

      <div className="impact-areas__grid">
        {IMPACT_AREAS.map(
          (
            {
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
            },
            index
          ) => {
            const Icon = AREA_ICONS[icon] || IconUsersGroup;
            const overrideKey = `impactPageArea${index + 1}`;
            const areaKey = `area${index + 1}`;
            const displayTitleLead = resolveOverrideText(overrides[`${overrideKey}TitleLead`], titleLead, t(`impact:areas.${areaKey}.titleLead`));
            const displayTitleAccent = resolveOverrideText(overrides[`${overrideKey}TitleAccent`], titleAccent, t(`impact:areas.${areaKey}.titleAccent`));
            const displayDescription = resolveOverrideText(overrides[`${overrideKey}Description`], description, t(`impact:areas.${areaKey}.description`));
            const displayButtonLabel = resolveOverrideText(overrides[`${overrideKey}ButtonLabel`], buttonLabel, t(`impact:areas.${areaKey}.buttonLabel`));
            const displayButtonLink = overrides[`${overrideKey}ButtonLink`] || (buttonStyle === "whatsapp" ? buttonHref : buttonTo);
            const translatedItems = t(`impact:areas.${areaKey}.items`, { returnObjects: true });
            const displayItems = overrides[`${overrideKey}Bullets`]
              ? overrides[`${overrideKey}Bullets`].split("\n").filter(Boolean)
              : Array.isArray(translatedItems)
                ? translatedItems
                : items;

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
                    {displayTitleLead}
                    <span className="impact-area-card__title-accent">{displayTitleAccent}</span>
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

                  <p className="impact-area-card__description">{displayDescription}</p>

                  <ul className="impact-area-card__list">
                    {displayItems.map((item) => (
                      <li key={item}>
                        <IconCheck size={16} stroke={2.2} aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {buttonStyle === "whatsapp" ? (
                    <a
                      className="impact-area-card__button impact-area-card__button--whatsapp"
                      href={displayButtonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandWhatsapp
                        className="impact-area-card__button-whatsapp-icon"
                        aria-hidden
                        stroke={1.75}
                      />
                      <span>{displayButtonLabel}</span>
                    </a>
                  ) : (
                    <Link
                      to={displayButtonLink}
                      className="impact-area-card__button impact-area-card__button--outline"
                    >
                      {displayButtonLabel}
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
