import {
  IconHeart,
  IconLeaf,
  IconMusic,
  IconSchool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { DONATION_ALLOCATION } from "../../data/donateTiersDisplay.js";
import "../../styles/donate-allocation-section.css";

const ALLOCATION_ICONS = {
  music: IconMusic,
  users: IconUsers,
  school: IconSchool,
  heartbeat: IconHeart,
  globe: IconWorld,
  leaf: IconLeaf,
};

export default function DonateAllocationSection() {
  return (
    <section
      id="donate-allocation"
      className="donate-allocation-section"
      aria-labelledby="donate-allocation-title"
    >
      <div className="donate-allocation-section__inner">
        <h2 id="donate-allocation-title" className="donate-allocation-section__title">
          Where Your Donation Goes
        </h2>

        <div className="donate-allocation-section__grid" role="list">
          {DONATION_ALLOCATION.map(({ title, text, icon }) => {
            const Icon = ALLOCATION_ICONS[icon] || IconUsers;

            return (
              <article key={title} className="donate-allocation-section__item" role="listitem">
                <span className="donate-allocation-section__icon-wrap" aria-hidden="true">
                  <Icon className="donate-allocation-section__icon" stroke={1.5} />
                </span>
                <h3 className="donate-allocation-section__item-title">{title}</h3>
                <p className="donate-allocation-section__item-text">{text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
