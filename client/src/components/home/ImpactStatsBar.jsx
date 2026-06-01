import { impactStats } from "../../data/impactStats.js";
import "../../styles/impact-stats-bar.css";

export default function ImpactStatsBar() {
  return (
    <section className="impact-stats-bar-section" aria-label="Impact statistics">
      <div className="impact-stats-bar" role="list">
        {impactStats.map(({ icon: Icon, value, title }, index) => (
          <article
            key={title}
            className={`impact-stats-bar__item${index < impactStats.length - 1 ? " impact-stats-bar__item--divided" : ""}`}
            role="listitem"
          >
            <span className="impact-stats-bar__icon-wrap" aria-hidden="true">
              <Icon className="impact-stats-bar__icon" />
            </span>
            <div className="impact-stats-bar__copy">
              <p className="impact-stats-bar__value">{value}</p>
              <p className="impact-stats-bar__label">{title}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
