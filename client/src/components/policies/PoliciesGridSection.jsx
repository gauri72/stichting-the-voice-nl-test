import {
  IconArrowRight,
  IconFileText,
  IconLock,
  IconReceipt,
  IconShield,
  IconShieldCheck,
  IconTicket,
  IconUserShield,
  IconUsersGroup,
} from "@tabler/icons-react";
import { POLICIES_GRID } from "../../data/policiesDisplay.js";

const POLICY_ICONS = {
  "shield-user": IconUserShield,
  lock: IconLock,
  cookie: IconFileText,
  people: IconUsersGroup,
  ticket: IconTicket,
  cart: IconReceipt,
  "shield-check": IconShieldCheck,
  "file-text": IconFileText,
  shield: IconShield,
};

export default function PoliciesGridSection() {
  return (
    <section className="policies-grid-section" aria-labelledby="policies-grid-title">
      <div className="policies-grid-section__header">
        <span className="policies-grid-section__line" aria-hidden="true" />
        <h2 id="policies-grid-title" className="policies-section-title">
          OUR POLICIES
        </h2>
        <span className="policies-grid-section__line" aria-hidden="true" />
      </div>

      <div className="policies-grid">
        {POLICIES_GRID.map(({ key, accent, icon, title, description, anchor }) => {
          const Icon = POLICY_ICONS[icon] || IconShield;

          return (
            <article
              key={key}
              className={`policies-card policies-card--${accent}`}
            >
              <span className="policies-card__icon" aria-hidden="true">
                <Icon size={28} stroke={1.5} />
              </span>
              <h3 className="policies-card__title">{title}</h3>
              <p className="policies-card__description">{description}</p>
              <a href={`#${anchor}`} className="policies-card__link">
                Read Policy
                <IconArrowRight size={16} stroke={2} aria-hidden />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
