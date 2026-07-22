import { useTranslation } from "react-i18next";
import { INNOVATION_HERO } from "../../data/innovationDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import HeroActionCluster from "../layout/HeroActionCluster.jsx";

export default function InnovationHeroSection() {
  const { t } = useTranslation(["innovation"]);
  const overrides = useContentOverrides();
  const { visual } = INNOVATION_HERO;

  return (
    <section className="innovation-hero" aria-labelledby="innovation-hero-title">
      <HeroActionCluster />
      <div className="innovation-hero__inner">
        <div className="innovation-hero__copy">
          <h1 id="innovation-hero-title" className="innovation-hero__title">
            {resolveOverrideText(overrides.ventureHeroTitleLead, INNOVATION_HERO.titleLead, t("innovation:hero.titleLead"))}{" "}
            <span className="innovation-accent--cyan">
              {resolveOverrideText(overrides.ventureHeroTitleAccent, INNOVATION_HERO.titleAccent, t("innovation:hero.titleAccent"))}
            </span>
          </h1>
          <p className="innovation-hero__description">
            {resolveOverrideText(overrides.ventureHeroDescription, INNOVATION_HERO.description, t("innovation:hero.description"))}
          </p>
        </div>

        <div className="innovation-hero__visual">
          <img src={visual} alt="" loading="eager" decoding="async" />
        </div>
      </div>
    </section>
  );
}
