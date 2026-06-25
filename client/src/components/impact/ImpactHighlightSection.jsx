import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconHeartHandshake,
  IconSpeakerphone,
  IconSparkles,
  IconUsersGroup,
} from "@tabler/icons-react";
import { IMPACT_HIGHLIGHT } from "../../data/impactDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const FEATURE_ICONS = {
  empower: IconUsersGroup,
  support: IconHeartHandshake,
  advocate: IconSpeakerphone,
};

export default function ImpactHighlightSection() {
  const { t } = useTranslation(["impact"]);
  const overrides = useContentOverrides();
  const { image, features } = IMPACT_HIGHLIGHT;
  const label = resolveOverrideText(overrides.impactPageHighlightLabel, IMPACT_HIGHLIGHT.label, t("impact:highlight.label"));
  const title = resolveOverrideText(overrides.impactPageHighlightTitle, IMPACT_HIGHLIGHT.title, t("impact:highlight.title"));
  const description = resolveOverrideText(overrides.impactPageHighlightDescription, IMPACT_HIGHLIGHT.description, t("impact:highlight.description"));
  const linkLabel = resolveOverrideText(overrides.impactPageHighlightLinkLabel, IMPACT_HIGHLIGHT.linkLabel, t("impact:highlight.linkLabel"));
  const linkTo = overrides.impactPageHighlightLink || IMPACT_HIGHLIGHT.linkTo;

  return (
    <section className="impact-highlight" aria-labelledby="impact-highlight-title">
      <div className="impact-highlight__label">
        <IconSparkles size={16} stroke={1.8} aria-hidden />
        {label}
      </div>

      <div className="impact-highlight__grid">
        <article className="impact-highlight__card">
          <div className="impact-highlight__card-media">
            <img src={image} alt={title} loading="lazy" />
          </div>
          <div className="impact-highlight__card-body">
            <h2 id="impact-highlight-title" className="impact-highlight__card-title">
              {title}
            </h2>
            <p className="impact-highlight__card-text">{description}</p>
            <Link to={linkTo} className="impact-highlight__card-link">
              {linkLabel}
              <IconArrowRight size={16} stroke={2} aria-hidden />
            </Link>
          </div>
        </article>

        <div className="impact-highlight__features" role="list">
          {features.map(({ key, title: featureTitle, description: featureText }, index) => {
            const Icon = FEATURE_ICONS[key] || IconUsersGroup;
            const overrideKey = `impactPageHighlightFeature${index + 1}`;
            const featureKey = `feature${index + 1}`;

            return (
              <div key={key} className="impact-highlight__feature" role="listitem">
                <span className="impact-highlight__feature-icon" aria-hidden="true">
                  <Icon size={24} stroke={1.6} />
                </span>
                <div>
                  <h3 className="impact-highlight__feature-title">
                    {resolveOverrideText(overrides[`${overrideKey}Title`], featureTitle, t(`impact:highlight.${featureKey}.title`))}
                  </h3>
                  <p className="impact-highlight__feature-text">
                    {resolveOverrideText(overrides[`${overrideKey}Description`], featureText, t(`impact:highlight.${featureKey}.description`))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
