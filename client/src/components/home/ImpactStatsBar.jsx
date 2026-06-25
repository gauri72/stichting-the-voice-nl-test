import { useTranslation } from "react-i18next";
import { impactStats } from "../../data/impactStats.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/impact-stats-bar.css";

export default function ImpactStatsBar() {
  const { t } = useTranslation(["home"]);
  const overrides = useContentOverrides();

  return (
    <section className="impact-stats-bar-section" aria-label="Impact statistics">
      <div className="impact-stats-bar" role="list">
        {impactStats.map(({ icon: Icon, value, title }, index) => {
          const overrideKey = `stat${index + 1}`;
          const displayValue = overrides[`${overrideKey}Value`] || value;
          const displayLabel = resolveOverrideText(
            overrides[`${overrideKey}Label`],
            title,
            t(`home:impactStats.${overrideKey}`)
          );
          return (
            <article
              key={index}
              className={`impact-stats-bar__item${index < impactStats.length - 1 ? " impact-stats-bar__item--divided" : ""}`}
              role="listitem"
            >
              <span className="impact-stats-bar__icon-wrap" aria-hidden="true">
                <Icon className="impact-stats-bar__icon" stroke={1.75} />
              </span>
              <div className="impact-stats-bar__copy">
                <p className="impact-stats-bar__value">{displayValue}</p>
                <p className="impact-stats-bar__label">{displayLabel}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
