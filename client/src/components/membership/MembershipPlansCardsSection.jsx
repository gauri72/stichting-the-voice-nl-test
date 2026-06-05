import {
  IconCheck,
  IconCrown,
  IconSchool,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { MEMBERSHIP_TIERS } from "../../data/membershipPlansDisplay.js";
import "../../styles/membership-plans-cards-section.css";

const TIER_ICONS = {
  school: IconSchool,
  user: IconUser,
  family: IconUsers,
  crown: IconCrown,
  crownFamily: IconUsersGroup,
};

export default function MembershipPlansCardsSection() {
  return (
    <section
      id="membership-plans"
      className="membership-plans-cards-section"
      aria-labelledby="membership-plans-title"
    >
      <div className="membership-plans-cards-section__inner">
        <h2 id="membership-plans-title" className="visually-hidden">
          Membership plans
        </h2>

        <div className="membership-plans-cards" role="list">
          {MEMBERSHIP_TIERS.map((tier) => {
            const Icon = TIER_ICONS[tier.icon] || IconUser;

            return (
              <article
                key={tier.id}
                className={`membership-plans-card membership-plans-card--${tier.theme}${
                  tier.popular ? " membership-plans-card--popular" : ""
                }`}
                role="listitem"
              >
                {tier.popular ? (
                  <p
                    className="membership-plans-card__badge membership-plans-card__badge--desktop"
                    aria-label="Most popular plan"
                  >
                    <span aria-hidden="true">★</span> MOST POPULAR <span aria-hidden="true">★</span>
                  </p>
                ) : null}

                <div className="membership-plans-card__inner">
                  <div className="membership-plans-card__icon-wrap" aria-hidden="true">
                    <span className="membership-plans-card__icon-ring">
                      <Icon className="membership-plans-card__icon" stroke={1.6} />
                    </span>
                  </div>

                  <div className="membership-plans-card__content">
                    <div className="membership-plans-card__info">
                      {tier.popular ? (
                        <p
                          className="membership-plans-card__badge membership-plans-card__badge--mobile"
                          aria-hidden="true"
                        >
                          <span aria-hidden="true">★</span> MOST POPULAR <span aria-hidden="true">★</span>
                        </p>
                      ) : null}
                      <h3 className="membership-plans-card__title">{tier.name}</h3>
                      <p className="membership-plans-card__price">
                        {tier.price}
                        <span className="membership-plans-card__price-period">/year</span>
                      </p>
                      <p className="membership-plans-card__description">{tier.description}</p>
                    </div>

                    <ul className="membership-plans-card__features">
                      {tier.cardFeatures.map((feature) => (
                        <li key={feature}>
                          <IconCheck
                            className="membership-plans-card__feature-icon"
                            size={16}
                            stroke={2.5}
                            aria-hidden
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tier.moreBenefitsNote ? (
                        <li className="membership-plans-card__features-more">{tier.moreBenefitsNote}</li>
                      ) : null}
                    </ul>
                  </div>

                  <button type="button" className="membership-plans-card__cta">
                    Become a Member
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
