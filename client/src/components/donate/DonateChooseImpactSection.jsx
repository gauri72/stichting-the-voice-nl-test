import {
  FaGem,
  FaHeart,
  FaStar,
  FaTheaterMasks,
  FaUsers,
} from "react-icons/fa";
import { HiMiniCheck } from "react-icons/hi2";
import "../../styles/donate-section-heading.css";
import "../../styles/donate-choose-impact-section.css";

const tiers = [
  {
    id: "25",
    amount: "€25",
    name: "Supporter",
    description: "Help us keep cultural programs accessible to everyone.",
    Icon: FaHeart,
    featured: false,
  },
  {
    id: "50",
    amount: "€50",
    name: "Friend",
    description: "Strengthen workshops, screenings, and community gatherings.",
    Icon: FaTheaterMasks,
    featured: false,
  },
  {
    id: "100",
    amount: "€100",
    name: "Champion",
    description: "Become a core supporter of our flagship events and outreach.",
    Icon: FaStar,
    featured: true,
  },
  {
    id: "250",
    amount: "€250",
    name: "Patron",
    description: "Support larger initiatives and help expand our reach worldwide.",
    Icon: FaUsers,
    featured: false,
  },
  {
    id: "500",
    amount: "€500+",
    name: "Visionary",
    description: "Make a transformative impact and help shape a better future.",
    Icon: FaGem,
    featured: false,
  },
];

export default function DonateChooseImpactSection() {
  return (
    <section id="donate-tiers" className="donate-tiers" aria-labelledby="donate-tiers-title">
      <div className="donate-tiers__container">
        <header className="donate-section__header">
          <p className="donate-section__eyebrow">Make a Difference</p>
          <div className="donate-section__heading">
            <span className="donate-section__heading-line" aria-hidden="true" />
            <h2 id="donate-tiers-title" className="donate-section__title">
              Choose Your Impact
            </h2>
            <span className="donate-section__heading-line" aria-hidden="true" />
          </div>
          <p className="donate-section__lead">
            Every contribution, big or small, helps us continue our mission of promoting culture,
            creativity and community.
          </p>
        </header>

        <div className="donate-tiers__grid" role="list" aria-label="Donation amounts">
          {tiers.map(({ id, amount, name, description, Icon, featured }) => (
            <article
              key={id}
              className={`donate-tier-card ${featured ? "donate-tier-card--featured" : ""}`}
              role="listitem"
            >
              {featured ? (
                <p className="donate-tier-card__tag">Most Popular</p>
              ) : (
                <span className="donate-tier-card__tag-spacer" aria-hidden="true" />
              )}
              <div className="donate-tier-card__icon-wrap">
                <span className="donate-tier-card__icon" aria-hidden="true">
                  <Icon />
                </span>
              </div>
              <p className="donate-tier-card__amount">{amount}</p>
              <h3 className="donate-tier-card__name">{name}</h3>
              <p className="donate-tier-card__description">{description}</p>
              <a
                className={`donate-tier-card__cta ${featured ? "donate-tier-card__cta--solid" : "donate-tier-card__cta--outline"}`}
                href={`mailto:info@stichtingthevoice.nl?subject=Donation%20${encodeURIComponent(amount)}%20-%20${encodeURIComponent(name)}`}
              >
                Donate Now
              </a>
            </article>
          ))}
        </div>

        <p className="donate-tiers__secure">
          <HiMiniCheck aria-hidden className="donate-tiers__secure-icon" />
          <span className="donate-tiers__secure-headline">100% Secure Donations.</span>
          <span className="donate-tiers__secure-subtext">Your contribution is safe with us.</span>
        </p>
      </div>
    </section>
  );
}
