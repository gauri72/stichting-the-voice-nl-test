import { useTranslation } from "react-i18next";
import {
  IconCheck,
  IconCrown,
  IconDiamond,
  IconHeart,
  IconHeartHandshake,
  IconStar,
} from "@tabler/icons-react";
import { SPONSORSHIP_TIERS } from "../../data/sponsorshipTiersDisplay.js";
import "../../styles/sponsorship-plans-cards-section.css";

const TIER_ICONS = {
  handshake: IconHeartHandshake,
  star: IconStar,
  crown: IconCrown,
  gem: IconDiamond,
  heart: IconHeart,
};

export default function SponsorshipPlansCardsSection({ selectedTierId, onSelectTier }) {
  const { t } = useTranslation(["sponsorship"]);

  return (
    <section
      id="sponsorship-plans"
      className="sponsorship-plans-cards-section"
      aria-labelledby="sponsorship-plans-title"
    >
      <div className="sponsorship-plans-cards-section__inner">
        <h2 id="sponsorship-plans-title" className="visually-hidden">
          {t("sponsorship:plans.heading")}
        </h2>

        <div className="sponsorship-plans-cards" role="list">
          {SPONSORSHIP_TIERS.map((tier) => {
            const Icon = TIER_ICONS[tier.icon] || IconHeartHandshake;
            const isCustomPrice = tier.price === "Custom";
            const tierKey = tier.id;
            const features = t(`sponsorship:plans.${tierKey}.features`, { returnObjects: true });

            return (
              <article
                key={tier.id}
                className={`sponsorship-plans-card sponsorship-plans-card--${tier.theme}${
                  tier.popular ? " sponsorship-plans-card--popular" : ""
                }`}
                role="listitem"
              >
                {tier.popular ? (
                  <p
                    className="sponsorship-plans-card__badge sponsorship-plans-card__badge--desktop"
                    aria-label="Most popular tier"
                  >
                    <span aria-hidden="true">★</span> {t("sponsorship:plans.mostPopular")} <span aria-hidden="true">★</span>
                  </p>
                ) : null}

                <div className="sponsorship-plans-card__inner">
                  <div className="sponsorship-plans-card__icon-wrap" aria-hidden="true">
                    <span className="sponsorship-plans-card__icon-ring">
                      <Icon className="sponsorship-plans-card__icon" stroke={1.6} />
                    </span>
                  </div>

                  <div className="sponsorship-plans-card__content">
                    <div className="sponsorship-plans-card__info">
                      {tier.popular ? (
                        <p
                          className="sponsorship-plans-card__badge sponsorship-plans-card__badge--mobile"
                          aria-hidden="true"
                        >
                          <span aria-hidden="true">★</span> {t("sponsorship:plans.mostPopular")} <span aria-hidden="true">★</span>
                        </p>
                      ) : null}
                      <h3 className="sponsorship-plans-card__title">{t(`sponsorship:plans.${tierKey}.name`)}</h3>
                      <p
                        className={`sponsorship-plans-card__price${
                          isCustomPrice ? " sponsorship-plans-card__price--custom" : ""
                        }`}
                      >
                        {tier.price}
                      </p>
                      <p className="sponsorship-plans-card__description">{t(`sponsorship:plans.${tierKey}.description`)}</p>
                    </div>

                    <ul className="sponsorship-plans-card__features">
                      {Array.isArray(features)
                        ? features.map((feature) => (
                            <li key={feature}>
                              <IconCheck
                                className="sponsorship-plans-card__feature-icon"
                                size={16}
                                stroke={2.5}
                                aria-hidden
                              />
                              <span>{feature}</span>
                            </li>
                          ))
                        : null}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="sponsorship-plans-card__cta cta-pulse"
                    onClick={() => onSelectTier?.(tier)}
                    aria-controls="sponsorship-payment"
                    aria-expanded={selectedTierId === tier.id}
                  >
                    {selectedTierId === tier.id ? t("sponsorship:plans.selected") : t("sponsorship:plans.becomeASponsor")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
