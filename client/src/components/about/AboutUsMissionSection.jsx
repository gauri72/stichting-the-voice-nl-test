import { useTranslation } from "react-i18next";
import { IconTarget } from "@tabler/icons-react";
import { ABOUT_MISSION } from "../../data/aboutUsDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function AboutUsMissionSection() {
  const { t } = useTranslation(["about"]);
  const overrides = useContentOverrides();
  const label = resolveOverrideText(overrides.aboutMissionLabel, ABOUT_MISSION.label, t("about:mission.label"));
  const overrideText = overrides.aboutMissionText;

  return (
    <section className="about-us-mission" aria-labelledby="about-us-mission-title">
      <div className="about-us-mission__inner">
        <div className="about-us-mission__label-wrap">
          <span className="about-us-mission__icon-wrap" aria-hidden="true">
            <IconTarget className="about-us-mission__icon" stroke={1.5} />
          </span>
          <h2 id="about-us-mission-title" className="about-us-mission__label">
            {label}
          </h2>
        </div>

        {overrideText ? (
          <p className="about-us-mission__text">{overrideText}</p>
        ) : (
          <p className="about-us-mission__text">
            {t("about:mission.textBefore")}
            <span className="about-us-accent">{t("about:mission.highlight1")}</span>,{" "}
            <span className="about-us-accent">{t("about:mission.highlight2")}</span>, and{" "}
            <span className="about-us-accent">{t("about:mission.highlight3")}</span>
            {t("about:mission.textMiddle")}
            <span className="about-us-accent">{t("about:mission.cultureHighlight")}</span>
            {t("about:mission.textAfter")}
          </p>
        )}
      </div>
    </section>
  );
}
