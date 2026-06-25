import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconChartBar,
  IconCheck,
  IconRocket,
  IconUsersGroup,
} from "@tabler/icons-react";
import { INNOVATION_INITIATIVES } from "../../data/innovationDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const INITIATIVE_ICONS = {
  rocket: IconRocket,
  people: IconUsersGroup,
  chart: IconChartBar,
};

export default function InnovationInitiativesSection() {
  const { t } = useTranslation(["innovation"]);
  const overrides = useContentOverrides();

  return (
    <section className="innovation-initiatives" aria-labelledby="innovation-initiatives-title">
      <h2 id="innovation-initiatives-title" className="innovation-section-title">
        {resolveOverrideText(overrides.ventureInitiativesHeading, "Our Key Initiatives", t("innovation:initiatives.heading"))}
      </h2>

      <div className="innovation-initiatives__grid">
        {INNOVATION_INITIATIVES.map(
          (
            {
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
            },
            index
          ) => {
            const Icon = INITIATIVE_ICONS[icon] || IconRocket;
            const overrideKey = `ventureInitiative${index + 1}`;
            const itemKey = `item${index + 1}`;
            const displayTitle = resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`innovation:initiatives.${itemKey}.title`));
            const displayTagline = resolveOverrideText(overrides[`${overrideKey}Tagline`], tagline, t(`innovation:initiatives.${itemKey}.tagline`));
            const displayDescription = resolveOverrideText(overrides[`${overrideKey}Description`], description, t(`innovation:initiatives.${itemKey}.description`));
            const translatedItems = t(`innovation:initiatives.${itemKey}.items`, { returnObjects: true });
            const displayItems = overrides[`${overrideKey}Bullets`]
              ? overrides[`${overrideKey}Bullets`].split("\n").filter(Boolean)
              : Array.isArray(translatedItems)
                ? translatedItems
                : items;
            const displayButtonLabel = buttonLabel
              ? resolveOverrideText(overrides[`${overrideKey}ButtonLabel`], buttonLabel, t("innovation:initiatives.item3.buttonLabel"))
              : buttonLabel;

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

                <h3 className="innovation-initiative-card__title">{displayTitle}</h3>
                <p className="innovation-initiative-card__tagline">{displayTagline}</p>
                <p className="innovation-initiative-card__description">{displayDescription}</p>

                <ul className="innovation-initiative-card__list">
                  {displayItems.map((item) => (
                    <li key={item}>
                      <IconCheck size={16} stroke={2.2} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>

                {buttonLabel ? (
                  buttonStyle === "whatsapp" ? (
                    <a
                      className="innovation-initiative-card__button innovation-initiative-card__button--whatsapp"
                      href={buttonHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandWhatsapp size={18} stroke={1.6} aria-hidden />
                      {displayButtonLabel}
                      <IconArrowRight size={16} stroke={2} aria-hidden />
                    </a>
                  ) : buttonHref ? (
                    <a
                      href={buttonHref}
                      className="innovation-initiative-card__button innovation-initiative-card__button--outline"
                    >
                      {displayButtonLabel}
                      <IconArrowRight size={16} stroke={2} aria-hidden />
                    </a>
                  ) : (
                    <Link
                      to={buttonTo}
                      className="innovation-initiative-card__button innovation-initiative-card__button--outline"
                    >
                      {displayButtonLabel}
                      <IconArrowRight size={16} stroke={2} aria-hidden />
                    </Link>
                  )
                ) : null}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}
