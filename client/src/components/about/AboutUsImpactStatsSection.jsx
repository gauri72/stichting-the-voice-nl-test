import {
  IconHeartHandshake,
  IconSchool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { ABOUT_IMPACT_STATS } from "../../data/aboutUsDisplay.js";

const STAT_ICONS = {
  teal: IconUsers,
  magenta: IconSchool,
  blue: IconHeartHandshake,
  gold: IconWorld,
};

export default function AboutUsImpactStatsSection() {
  return (
    <section className="about-us-impact" aria-label="About us impact statistics">
      <div className="about-us-impact__grid" role="list">
        {ABOUT_IMPACT_STATS.map(({ value, label, accent }) => {
          const Icon = STAT_ICONS[accent] || IconUsers;

          return (
            <article
              key={label}
              className={`about-us-impact__item about-us-impact__item--${accent}`}
              role="listitem"
            >
              <span className="about-us-impact__icon-wrap" aria-hidden="true">
                <Icon className="about-us-impact__icon" stroke={1.5} />
              </span>
              <p className="about-us-impact__value">{value}</p>
              <p className="about-us-impact__label">{label}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
