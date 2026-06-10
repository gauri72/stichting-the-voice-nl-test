import {
  IconHeartHandshake,
  IconSchool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { IMPACT_STATS } from "../../data/impactDisplay.js";

const STAT_ICONS = {
  users: IconUsers,
  graduation: IconSchool,
  "heart-hands": IconHeartHandshake,
  globe: IconWorld,
};

export default function ImpactInActionSection() {
  return (
    <section className="impact-in-action" aria-labelledby="impact-in-action-title">
      <h2 id="impact-in-action-title" className="impact-section-title">
        Our Impact In Action
      </h2>

      <div className="impact-in-action__stats" role="list">
        {IMPACT_STATS.map(({ value, label, accent, icon }) => {
          const Icon = STAT_ICONS[icon] || IconUsers;

          return (
            <div
              key={label}
              className={`impact-stat impact-stat--${accent}`}
              role="listitem"
            >
              <span className="impact-stat__icon" aria-hidden="true">
                <Icon size={22} stroke={1.6} />
              </span>
              <p className="impact-stat__value">{value}</p>
              <p className="impact-stat__label">{label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
