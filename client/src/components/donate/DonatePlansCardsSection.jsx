import { useTranslation } from "react-i18next";
import {
  IconCheck,
  IconDiamond,
  IconHeart,
  IconHeartHandshake,
  IconMasksTheater,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { DONATION_TIERS } from "../../data/donateTiersDisplay.js";
import "../../styles/donate-plans-cards-section.css";

const TIER_ICONS = {
  heart: IconHeart,
  masks: IconMasksTheater,
  star: IconStar,
  users: IconUsers,
  gem: IconDiamond,
  heartHand: IconHeartHandshake,
};

export default function DonatePlansCardsSection({ selectedTierId, onSelectTier }) {
  const { t } = useTranslation(["donate"]);

  return (
    <section
      id="donate-plans"
      className="donate-plans-cards-section"
      aria-labelledby="donate-plans-title"
    >
      <div className="donate-plans-cards-section__inner">
        <h2 id="donate-plans-title" className="visually-hidden">
          {t("donate:plans.heading")}
        </h2>

        <div className="donate-plans-cards" role="list">
          {DONATION_TIERS.map((tier, index) => {
            const Icon = TIER_ICONS[tier.icon] || IconHeart;
            const isCustomPrice = tier.price === "Custom";
            const tierKey = `tier${index + 1}`;

            return (
              <article
                key={tier.id}
                className={`donate-plans-card donate-plans-card--${tier.theme}${
                  tier.popular ? " donate-plans-card--popular" : ""
                }`}
                role="listitem"
              >
                {tier.popular ? (
                  <p
                    className="donate-plans-card__badge donate-plans-card__badge--desktop"
                    aria-label="Most popular amount"
                  >
                    <span aria-hidden="true">★</span> {t("donate:plans.mostPopular")} <span aria-hidden="true">★</span>
                  </p>
                ) : null}

                <div className="donate-plans-card__inner">
                  <div className="donate-plans-card__icon-wrap" aria-hidden="true">
                    <span className="donate-plans-card__icon-ring">
                      <Icon className="donate-plans-card__icon" stroke={1.6} />
                    </span>
                  </div>

                  <div className="donate-plans-card__content">
                    <div className="donate-plans-card__info">
                      {tier.popular ? (
                        <p
                          className="donate-plans-card__badge donate-plans-card__badge--mobile"
                          aria-hidden="true"
                        >
                          <span aria-hidden="true">★</span> {t("donate:plans.mostPopular")} <span aria-hidden="true">★</span>
                        </p>
                      ) : null}
                      <p
                        className={`donate-plans-card__price${
                          isCustomPrice ? " donate-plans-card__price--custom" : ""
                        }`}
                      >
                        {tier.price}
                      </p>
                      <h3 className="donate-plans-card__title">{t(`donate:plans.${tierKey}.name`)}</h3>
                      <p className="donate-plans-card__description">{t(`donate:plans.${tierKey}.description`)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="donate-plans-card__cta cta-pulse"
                    onClick={() => onSelectTier?.(tier)}
                    aria-controls="donate-payment"
                    aria-expanded={selectedTierId === tier.id}
                  >
                    {selectedTierId === tier.id ? t("donate:plans.selected") : t("donate:plans.donateNow")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p className="donate-plans-cards-section__secure">
          <IconCheck className="donate-plans-cards-section__secure-icon" size={18} stroke={2.5} aria-hidden />
          <span className="donate-plans-cards-section__secure-headline">{t("donate:plans.secureHeadline")}</span>
          <span className="donate-plans-cards-section__secure-subtext">
            {t("donate:plans.secureSubtext")}
          </span>
        </p>
      </div>
    </section>
  );
}
