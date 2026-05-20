import "../../styles/membership-matrix-section.css";
import { FaCheck, FaTimes, FaUsers, FaUser, FaCrown, FaVenus } from "react-icons/fa";
import { MATRIX_FEATURE_ROWS, MATRIX_PLANS } from "../../config/membershipMatrix.js";

const PLAN_ICONS = {
  family: FaUsers,
  single: FaUser,
  privileged: FaCrown,
  vownl: FaVenus,
};

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
  const plans = MATRIX_PLANS.map((plan) => ({
    ...plan,
    Icon: PLAN_ICONS[plan.id] || FaUser,
  }));

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
                {MATRIX_FEATURE_ROWS.map((row) => (
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
