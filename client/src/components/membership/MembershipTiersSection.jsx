import { FaCheck, FaCrown, FaGem, FaStar, FaUsers } from "react-icons/fa";
import "../../styles/membership-tiers-section.css";

const membershipTiers = [
  {
    id: "friend",
    title: "Friend Member",
    price: "€50",
    Icon: FaUsers,
    benefits: [
      "Newsletter & updates",
      "Early access to events",
      "Member community access",
      "Invitation to member meetups",
    ],
  },
  {
    id: "supporter",
    title: "Supporter Member",
    price: "€100",
    Icon: FaStar,
    benefits: [
      "All Friend benefits",
      "Discount on select events",
      "Exclusive member content",
      "Recognition on our website",
    ],
  },
  {
    id: "patron",
    title: "Patron Member",
    price: "€250",
    Icon: FaCrown,
    popular: true,
    benefits: [
      "All Supporter benefits",
      "VIP access to signature events",
      "Behind-the-scenes access",
      "Name in event acknowledgments",
      "Tax-deductible contribution",
    ],
  },
  {
    id: "visionary",
    title: "Visionary Member",
    price: "€500+",
    Icon: FaGem,
    benefits: [
      "All Patron benefits",
      "Personalized recognition",
      "Exclusive roundtable invites",
      "Direct impact on programs",
      "Tax-deductible contribution",
    ],
  },
];

export default function MembershipTiersSection() {
  return (
    <section className="membership-tiers" aria-labelledby="membership-tiers-title">
      <div className="membership-tiers__container">
        <p className="membership-tiers__kicker">Our Memberships</p>
        <h2 id="membership-tiers-title">Membership Tiers</h2>
        <p className="membership-tiers__intro">
          Choose a membership that suits you. Every membership directly supports our cultural
          programs, events and community initiatives.
        </p>

        <div className="membership-tiers__grid" role="list" aria-label="Membership plans">
          {membershipTiers.map(({ id, title, price, Icon, benefits, popular }) => (
            <article key={id} className={`membership-tier-card ${popular ? "is-popular" : ""}`} role="listitem">
              {popular ? <p className="membership-tier-card__badge">Most Popular</p> : null}

              <div className="membership-tier-card__icon" aria-hidden="true">
                <Icon />
              </div>

              <h3>{title}</h3>
              <p className="membership-tier-card__price">
                <span>{price}</span> / year
              </p>

              <ul className="membership-tier-card__benefits">
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <FaCheck aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <a className={`membership-tier-card__cta ${popular ? "is-popular" : ""}`} href="mailto:info@Stichtingthevoice.nl">
                Become a Member
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
