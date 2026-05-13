import "../../styles/membership-matrix-section.css";
import { FaCheck, FaTimes, FaUsers, FaUser, FaCrown, FaVenus } from "react-icons/fa";

const rows = [
  {
    feature: "All 4 Flagship Events In A Year",
    family: "100% Free",
    single: "100% Free",
    privileged: "10% Discount",
    vownl: "10% Discount",
  },
  {
    feature: "Partner Ticket For All 4 Flagship Events",
    family: "100% Free",
    single: "10% Discount",
    privileged: "10% Discount",
    vownl: "10% Discount",
  },
  {
    feature: "Reserved Seats",
    family: "Reserved Premium Seats",
    single: "Reserved Premium Seats",
    privileged: "Reserved Privileged Seats",
    vownl: "Reserved Privileged Seats",
  },
  {
    feature: "Child Ticket (max 2)",
    family: "50% Discount",
    single: "50% Discount",
    privileged: "15% Discount",
    vownl: "15% Discount",
  },
  {
    feature: "Welcome Kit",
    family: "included",
    single: "included",
    privileged: "not-included",
    vownl: "not-included",
  },
  {
    feature: "Sponsors Offers (Partner Benefits)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Lounge Access During Events",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Celebrity Priority Meetup (Invite Only)",
    family: "included",
    single: "included",
    privileged: "included",
    vownl: "included",
  },
  {
    feature: "Price",
    family: "250€",
    single: "150€",
    privileged: "25€",
    vownl: "75€",
  },
];

function Cell({ value }) {
  if (value === "included") {
    return (
      <span className="membership-matrix__status membership-matrix__status--ok">
        <FaCheck aria-hidden="true" />
        Included
      </span>
    );
  }
  if (value === "not-included") {
    return (
      <span className="membership-matrix__status membership-matrix__status--no">
        <FaTimes aria-hidden="true" />
        Not Included
      </span>
    );
  }
  return <span className="membership-matrix__status membership-matrix__status--value">{value}</span>;
}

export default function MembershipMatrixSection({ onOpenMemberships = () => {} }) {
  const plans = [
    { id: "family", title: "Premium Family Membership", price: "€250", Icon: FaUsers },
    { id: "single", title: "Premium Single Membership", price: "€150", Icon: FaUser },
    {
      id: "privileged",
      title: "Privileged Membership",
      price: "€25",
      Icon: FaCrown,
      featured: true,
    },
    { id: "vownl", title: "VOWNL Membership", price: "€25", Icon: FaVenus },
  ];
  const featureRows = rows.filter((row) => row.feature !== "Price");

  return (
    <section id="membership-matrix" className="membership-matrix" aria-labelledby="membership-matrix-title">
      <div className="membership-matrix__container">
        <div className="membership-matrix__heading">
          <span className="membership-matrix__heading-line" aria-hidden="true" />
          <h2 id="membership-matrix-title" className="membership-matrix__title">
            Membership Plan Matrix
          </h2>
          <span className="membership-matrix__heading-line" aria-hidden="true" />
        </div>

        <div className="membership-matrix__cards" role="list" aria-label="Membership matrix cards">
          {plans.map(({ id, title, price, Icon, featured }) => (
            <article
              key={id}
              className={`membership-matrix__card${featured ? " membership-matrix__card--featured" : ""}`}
              role="listitem"
            >
              {featured ? <p className="membership-matrix__card-tag">Most Popular</p> : null}
              <div className="membership-matrix__card-icon" aria-hidden="true">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p className="membership-matrix__card-price">
                <span>{price}</span> / year
              </p>
              <ul className="membership-matrix__feature-list membership-matrix__feature-list--grow">
                {featureRows.map((row) => (
                  <li key={`${id}-${row.feature}`}>
                    <p className="membership-matrix__feature-name">{row.feature}</p>
                    <Cell value={row[id]} />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`membership-matrix__cta${featured ? " membership-matrix__cta--featured" : ""}`}
                onClick={onOpenMemberships}
              >
                Start Your Membership
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
