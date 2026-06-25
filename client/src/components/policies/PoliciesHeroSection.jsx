import { useTranslation } from "react-i18next";
import { POLICIES_HERO } from "../../data/policiesDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function PoliciesHeroSection() {
  const { t } = useTranslation(["policies"]);
  const overrides = useContentOverrides();
  const { visual } = POLICIES_HERO;

  return (
    <section className="policies-hero" aria-labelledby="policies-hero-title">
      <div className="policies-hero__inner">
        <div className="policies-hero__copy">
          <h1 id="policies-hero-title" className="policies-hero__title">
            <span className="policies-hero__title-line">
              {resolveOverrideText(overrides.policiesHeroTitleLead, POLICIES_HERO.titleLead, t("policies:hero.titleLead"))}
            </span>
            <span className="policies-hero__title-accent">
              {resolveOverrideText(overrides.policiesHeroTitleAccent, POLICIES_HERO.titleAccent, t("policies:hero.titleAccent"))}
            </span>
          </h1>
          <p className="policies-hero__tagline">
            {resolveOverrideText(overrides.policiesHeroTagline, POLICIES_HERO.tagline, t("policies:hero.tagline"))}
          </p>
          <p className="policies-hero__description">
            {resolveOverrideText(overrides.policiesHeroDescription, POLICIES_HERO.description, t("policies:hero.description"))}
          </p>
        </div>

        <div className="policies-hero__visual">
          <img src={visual} alt="" loading="eager" decoding="async" />
        </div>
      </div>
    </section>
  );
}
