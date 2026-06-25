import { useTranslation } from "react-i18next";
import { ABOUT_HERO } from "../../data/aboutUsDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function AboutUsHeroSection() {
  const { t } = useTranslation(["about"]);
  const overrides = useContentOverrides();

  return (
    <section className="about-us-hero" aria-labelledby="about-us-hero-title">
      <div className="about-us-hero__copy">
        <h1 id="about-us-hero-title" className="about-us-hero__title">
          {resolveOverrideText(overrides.aboutHeroTitleLead, ABOUT_HERO.titleLead, t("about:hero.titleLead"))}{" "}
          <span className="about-us-accent">
            {resolveOverrideText(overrides.aboutHeroTitleAccent, ABOUT_HERO.titleAccent, t("about:hero.titleAccent"))}
          </span>
        </h1>
        <p className="about-us-hero__tagline">
          {resolveOverrideText(overrides.aboutHeroTaglineLead, ABOUT_HERO.taglineLead, t("about:hero.taglineLead"))}{" "}
          <span className="about-us-accent">
            {resolveOverrideText(overrides.aboutHeroTaglineAccent, ABOUT_HERO.taglineAccent, t("about:hero.taglineAccent"))}
          </span>
        </p>
        <p className="about-us-hero__description">
          {resolveOverrideText(overrides.aboutHeroDescription, ABOUT_HERO.description, t("about:hero.description"))}
        </p>
      </div>
    </section>
  );
}
