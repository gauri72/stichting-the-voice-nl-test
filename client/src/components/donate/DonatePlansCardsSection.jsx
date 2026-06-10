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
  return (
    <section
      id="donate-plans"
      className="donate-plans-cards-section"
      aria-labelledby="donate-plans-title"
    >
      <div className="donate-plans-cards-section__inner">
        <h2 id="donate-plans-title" className="visually-hidden">
          Choose your impact
        </h2>

        <div className="donate-plans-cards" role="list">
          {DONATION_TIERS.map((tier) => {
            const Icon = TIER_ICONS[tier.icon] || IconHeart;
            const isCustomPrice = tier.price === "Custom";

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
                    <span aria-hidden="true">★</span> MOST POPULAR <span aria-hidden="true">★</span>
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
                          <span aria-hidden="true">★</span> MOST POPULAR <span aria-hidden="true">★</span>
                        </p>
                      ) : null}
                      <p
                        className={`donate-plans-card__price${
                          isCustomPrice ? " donate-plans-card__price--custom" : ""
                        }`}
                      >
                        {tier.price}
                      </p>
                      <h3 className="donate-plans-card__title">{tier.name}</h3>
                      <p className="donate-plans-card__description">{tier.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="donate-plans-card__cta"
                    onClick={() => onSelectTier?.(tier)}
                    aria-controls="donate-payment"
                    aria-expanded={selectedTierId === tier.id}
                  >
                    {selectedTierId === tier.id ? "Selected — scroll down" : "Donate Now"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p className="donate-plans-cards-section__secure">
          <IconCheck className="donate-plans-cards-section__secure-icon" size={18} stroke={2.5} aria-hidden />
          <span className="donate-plans-cards-section__secure-headline">100% Secure Donations.</span>
          <span className="donate-plans-cards-section__secure-subtext">
            Your contribution is safe with us.
          </span>
        </p>
      </div>
    </section>
  );
}
