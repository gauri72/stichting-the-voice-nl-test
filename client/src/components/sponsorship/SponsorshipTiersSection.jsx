import { useEffect, useRef, useState } from "react";
import {
  FaBullhorn,
  FaChartLine,
  FaCrown,
  FaGem,
  FaGlobe,
  FaHandHoldingHeart,
  FaHandshake,
  FaRegStar,
  FaUsers,
} from "react-icons/fa";
import { HiMiniCheck } from "react-icons/hi2";
import "../../styles/sponsorship-tiers-section.css";
import SponsorshipPaymentBlock from "./SponsorshipPaymentBlock";

const tiers = [
  {
    id: "custom",
    name: "Custom sponsorship",
    amount: "Custom",
    note: "Choose any amount that fits your budget and partnership goals.",
    Icon: FaHandHoldingHeart,
    allowCustom: true,
    customOnly: true,
    benefits: [
      "Any contribution amount you choose",
      "Recognition tailored to your support",
      "Social media thank-you mention",
      "Personal confirmation from our team",
    ],
  },
  {
    id: "associate",
    name: "Associate Sponsor",
    amount: "€300",
    note: "Support culture and community with entry-level brand recognition.",
    Icon: FaHandshake,
    benefits: [
      "Logo/name on sponsor section of website",
      "Social media thank-you mention",
      "Recognition in selected event materials",
      "Sponsor appreciation slide at event",
      "1 complimentary event pass",
    ],
  },
  {
    id: "silver",
    name: "Silver Sponsor",
    amount: "€500",
    note: "Increase your visibility while supporting our cultural events.",
    Icon: FaRegStar,
    benefits: [
      "All Associate benefits",
      "Logo on selected posters or digital event creatives",
      "Sponsor mention in event program/page",
      "1 dedicated social media shout-out",
      "Public acknowledgement during event",
      "4 complimentary event passes",
    ],
  },
  {
    id: "gold",
    name: "Gold Sponsor",
    amount: "€1,000",
    note: "Showcase your brand as a key supporter of cultural excellence.",
    Icon: FaCrown,
    benefits: [
      "All Silver benefits",
      "Premium logo placement on website and event screen",
      "Logo on banners/posters where applicable",
      "Half-page sponsor feature in event program/page",
      "2 dedicated social media posts/reels/stories",
      "Opportunity to present an award or address audience briefly, if event format allows",
      "4 complimentary event passes",
    ],
    featured: true,
  },
  {
    id: "platinum",
    name: "Platinum Sponsor",
    amount: "€1,500",
    note: "Maximum visibility. Become a leading partner in our cultural mission.",
    Icon: FaGem,
    benefits: [
      "All Gold benefits",
      "Recognition as Main Partner / Presenting Sponsor where applicable",
      "Full-page sponsor feature in event program/page",
      "Premium logo placement on main stage/screen and campaign creatives",
      "Brand mention in press/media communication where applicable",
      "Meet & greet or networking opportunity where applicable",
      "Category exclusivity subject to agreement",
      "6 complimentary event passes",
    ],
  },
];

const reasons = [
  {
    title: "Community Impact",
    text: "Empower diverse communities through the arts, culture, sports, and education.",
    Icon: FaUsers,
  },
  {
    title: "Global Exposure",
    text: "Reach a wide and engaged audience at international events and festivals.",
    Icon: FaGlobe,
  },
  {
    title: "Brand Visibility",
    text: "Showcase your brand across multiple platforms, events, and marketing channels.",
    Icon: FaBullhorn,
  },
  {
    title: "Positive Association",
    text: "Align your brand with values of unity, diversity, creativity, and social good.",
    Icon: FaHandshake,
  },
  {
    title: "Long-term Value",
    text: "Build lasting relationships and create measurable impact together.",
    Icon: FaChartLine,
  },
];

export default function SponsorshipTiersSection() {
  const [selectedTier, setSelectedTier] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    if (selectedTier && paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedTier]);

  function handleSelect(tier) {
    setSelectedTier({
      id: tier.id,
      name: tier.name,
      amountLabel: tier.amount,
      note: tier.note,
      allowCustom: Boolean(tier.allowCustom),
      customOnly: Boolean(tier.customOnly),
    });
  }

  return (
    <section id="sponsorship-tiers" className="sponsorship-tiers" aria-labelledby="sponsorship-tiers-title">
      <section className="sponsorship-why" aria-labelledby="sponsorship-why-title">
        <div className="sponsorship-why__container">
          <h2 id="sponsorship-why-title">
            Why Sponsor Stichting The V.O.I.C.E. NL?
          </h2>
          <div className="sponsorship-why__grid" role="list" aria-label="Reasons to sponsor">
            {reasons.map(({ title, text, Icon }) => (
              <article key={title} className="sponsorship-why__item" role="listitem">
                <span className="sponsorship-why__icon" aria-hidden>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="sponsorship-tiers__container">
        <header className="sponsorship-tiers__header">
          <p className="sponsorship-tiers__eyebrow">Sponsorship Opportunities</p>
          <div className="sponsorship-tiers__heading">
            <span className="sponsorship-tiers__heading-line" aria-hidden="true" />
            <h2 id="sponsorship-tiers-title" className="sponsorship-tiers__title">
              Sponsorship Tiers
            </h2>
            <span className="sponsorship-tiers__heading-line" aria-hidden="true" />
          </div>
          <p className="sponsorship-tiers__lead">
            Choose a sponsorship tier that aligns with your goals and showcase your commitment to culture,
            creativity and community.
          </p>
        </header>

        <div className="sponsorship-tiers__grid" role="list" aria-label="Sponsorship plans">
          {tiers.map((tier) => {
            const { id, name, amount, note, Icon, benefits, featured } = tier;
            const isActive = selectedTier?.id === id;
            return (
              <article
                key={id}
                className={`sponsorship-tier-card ${featured ? "is-featured" : ""} ${
                  isActive ? "is-active" : ""
                }`}
                role="listitem"
              >
                {featured ? <p className="sponsorship-tier-card__tag">Most Popular</p> : null}
                <div className="sponsorship-tier-card__icon-wrap">
                  <span className="sponsorship-tier-card__icon" aria-hidden>
                    <Icon />
                  </span>
                </div>
                <h3>{name}</h3>
                <p
                  className={`sponsorship-tier-card__amount ${
                    amount === "Custom" ? "sponsorship-tier-card__amount--text" : ""
                  }`}
                >
                  {amount}
                </p>
                <p className="sponsorship-tier-card__note">{note}</p>
                <ul className="sponsorship-tier-card__benefits">
                  {benefits.map((benefit) => (
                    <li key={`${name}-${benefit}`}>
                      <HiMiniCheck aria-hidden />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="sponsorship-tier-card__cta"
                  onClick={() => handleSelect(tier)}
                  aria-controls="sponsorship-payment"
                  aria-expanded={isActive}
                >
                  {isActive ? "Selected - Scroll Down" : "Become A Sponsor"}
                </button>
              </article>
            );
          })}
        </div>

        {selectedTier ? (
          <SponsorshipPaymentBlock
            ref={paymentRef}
            tier={selectedTier}
            onClose={() => setSelectedTier(null)}
          />
        ) : null}
      </div>

    </section>
  );
}
