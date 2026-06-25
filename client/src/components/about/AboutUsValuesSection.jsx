import { useTranslation } from "react-i18next";
import {
  IconBulb,
  IconHeartHandshake,
  IconShieldCheck,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { ABOUT_VALUES } from "../../data/aboutUsDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const VALUE_ICONS = {
  Inclusion: IconUsersGroup,
  Integrity: IconShieldCheck,
  Innovation: IconBulb,
  Integration: IconHeartHandshake,
  Impact: IconWorld,
};

const I18N_KEYS = ["inclusion", "integrity", "innovation", "integration", "impact"];

export default function AboutUsValuesSection() {
  const { t } = useTranslation(["about"]);
  const overrides = useContentOverrides();

  return (
    <section className="about-us-values-section" aria-labelledby="about-us-values-title">
      <div className="about-us-values-section__inner">
        <h2 id="about-us-values-title" className="about-us-section-title">
          {resolveOverrideText(overrides.aboutValuesHeading, "Our Values - 5Is", t("about:values.heading"))}
        </h2>
        <div className="about-us-values-section__grid" role="list">
          {ABOUT_VALUES.map(({ title, description }, index) => {
            // Icon is looked up by the ORIGINAL title, not the override, so
            // editing the displayed text never breaks the icon match.
            const Icon = VALUE_ICONS[title] || IconHeartHandshake;
            const overrideKey = `aboutValue${index + 1}`;
            const i18nKey = I18N_KEYS[index];

            return (
              <div key={title} className="about-us-values-section__item" role="listitem">
                <span className="about-us-values-section__icon-wrap" aria-hidden="true">
                  <Icon className="about-us-values-section__icon" stroke={1.5} />
                </span>
                <h3 className="about-us-values-section__item-title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`about:values.${i18nKey}.title`))}
                </h3>
                <p className="about-us-values-section__item-text">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], description, t(`about:values.${i18nKey}.description`))}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
