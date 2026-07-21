import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { impactStats } from "../../data/impactStats.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/our-impact.css";

const ACTION_CARDS = [
  { overrideKey: "impact1", i18nKey: "joinUs", labelEn: "Join Us", headingEn: "Be Part of the Change", descriptionEn: "Become a member or sponsor and help us continue creating meaningful impact through art and community.", ctaTextEn: "Become a Member", to: "/membership" },
  { overrideKey: "impact2", i18nKey: "sponsorUs", labelEn: "Sponsor Us", headingEn: "Support. Empower. Transform.", descriptionEn: "Your sponsorship helps us deliver cultural programs, elevate artists, and create wider community engagement.", ctaTextEn: "Become a Sponsor", to: "/sponsorship" },
  { overrideKey: "impact3", i18nKey: "donate", labelEn: "Donate", headingEn: "Give Hope Through Culture.", descriptionEn: "Every contribution powers inclusive events, nurtures young talent, and keeps community-led creativity thriving.", ctaTextEn: "Donate Now", to: "/donate" },
];

const STAT_I18N_KEYS = ["stat1", "stat2", "stat3", "stat4"];

export default function OurImpactSection() {
  const { t } = useTranslation(["home"]);
  const overrides = useContentOverrides();

  return (
    <section className="our-impact-section" aria-labelledby="our-impact-title">
      <div className="our-impact-top">
        <div className="our-impact-heading-row">
          <span className="our-impact-heading-line" aria-hidden="true" />
          <h2 id="our-impact-title" className="our-impact-heading">
            {t("home:ourImpact.title")}
          </h2>
          <span className="our-impact-heading-line" aria-hidden="true" />
        </div>

        <div className="our-impact-stats" role="list" aria-label="Impact highlights">
          {impactStats.map(({ icon: Icon, value, title, detail }, index) => {
            const overrideKey = `stat${index + 1}`;
            return (
              <article key={index} className="our-impact-stat" role="listitem">
                <span className="our-impact-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <p className="our-impact-value">{overrides[`${overrideKey}Value`] || value}</p>
                  <p className="our-impact-title">
                    {resolveOverrideText(overrides[`${overrideKey}Label`], title, t(`home:impactStats.${STAT_I18N_KEYS[index]}`))}
                  </p>
                  <p className="our-impact-detail">{detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="our-impact-actions">
        {ACTION_CARDS.map(({ overrideKey, i18nKey, labelEn, headingEn, descriptionEn, ctaTextEn, to }) => (
          <article key={overrideKey} className="our-impact-action-card">
            <p className="our-impact-action-label">
              {resolveOverrideText(overrides[`${overrideKey}Label`], labelEn, t(`home:ourImpact.${i18nKey}.label`))}
            </p>
            <h3>{resolveOverrideText(overrides[`${overrideKey}Heading`], headingEn, t(`home:ourImpact.${i18nKey}.heading`))}</h3>
            <p>{resolveOverrideText(overrides[`${overrideKey}Description`], descriptionEn, t(`home:ourImpact.${i18nKey}.description`))}</p>
            <Link className="our-impact-action-button cta-pulse" to={overrides[`${overrideKey}CtaLink`] || to}>
              {resolveOverrideText(overrides[`${overrideKey}CtaText`], ctaTextEn, t(`home:ourImpact.${i18nKey}.ctaText`))}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
