import {
  IconBolt,
  IconMasksTheater,
  IconMoodSmileBeam,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { DONATION_STATS } from "../../data/donateTiersDisplay.js";
import "../../styles/donate-real-impact-section.css";

const STAT_ICONS = {
  bolt: IconBolt,
  masks: IconMasksTheater,
  star: IconStar,
  users: IconUsers,
  smile: IconMoodSmileBeam,
};

export default function DonateRealImpactSection() {
  return (
    <section className="donate-impact-section" aria-labelledby="donate-impact-title">
      <div className="donate-impact-section__inner">
        <h2 id="donate-impact-title" className="donate-impact-section__title">
          <span className="donate-impact-section__title-line">Real Impact.</span>
          <span className="donate-impact-section__title-accent">Real Change.</span>
        </h2>

        <ul className="donate-impact-section__stats" role="list">
          {DONATION_STATS.map(({ value, label, icon }) => {
            const Icon = STAT_ICONS[icon] || IconStar;

            return (
              <li key={label} className="donate-impact-section__stat" role="listitem">
                <span className="donate-impact-section__stat-icon-wrap" aria-hidden="true">
                  <Icon className="donate-impact-section__stat-icon" stroke={1.5} />
                </span>
                <div className="donate-impact-section__stat-text">
                  <span className="donate-impact-section__stat-value">{value}</span>
                  <span className="donate-impact-section__stat-label">{label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
