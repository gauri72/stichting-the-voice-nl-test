import {
  IconShieldCheck,
  IconTarget,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { INNOVATION_DELIVER } from "../../data/innovationDisplay.js";

const DELIVER_ICONS = {
  target: IconTarget,
  people: IconUsersGroup,
  globe: IconWorld,
  shield: IconShieldCheck,
};

export default function InnovationDeliverSection() {
  return (
    <section className="innovation-deliver" aria-labelledby="innovation-deliver-title">
      <h2 id="innovation-deliver-title" className="innovation-section-title">
        What We Deliver
      </h2>

      <div className="innovation-deliver__grid" role="list">
        {INNOVATION_DELIVER.map(({ key, icon, title, description }) => {
          const Icon = DELIVER_ICONS[icon] || IconTarget;

          return (
            <div key={key} className="innovation-deliver__item" role="listitem">
              <span className="innovation-deliver__icon" aria-hidden="true">
                <Icon size={26} stroke={1.5} />
              </span>
              <div className="innovation-deliver__copy">
                <h3 className="innovation-deliver__title">{title}</h3>
                <p className="innovation-deliver__text">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
