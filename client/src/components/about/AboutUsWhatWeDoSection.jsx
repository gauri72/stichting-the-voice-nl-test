import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight } from "@tabler/icons-react";
import { ABOUT_WHAT_WE_DO } from "../../data/aboutUsDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const I18N_KEYS = ["experience", "visionaries", "impact", "innovation"];

export default function AboutUsWhatWeDoSection() {
  const { t } = useTranslation(["about"]);
  const overrides = useContentOverrides();

  return (
    <section className="about-us-what-we-do" aria-labelledby="about-us-what-we-do-title">
      <h2 id="about-us-what-we-do-title" className="about-us-section-title">
        {resolveOverrideText(overrides.aboutWhatWeDoHeading, "What We Do", t("about:whatWeDo.heading"))}
      </h2>

      <div className="about-us-what-we-do__grid" role="list">
        {ABOUT_WHAT_WE_DO.map(({ title, description, image, to, accent }, index) => {
          const overrideKey = `aboutWhatWeDo${index + 1}`;
          const i18nKey = I18N_KEYS[index];
          return (
            <article
              key={title}
              className={`about-us-what-card about-us-what-card--${accent}`}
              role="listitem"
            >
              <div className="about-us-what-card__media">
                <img className="about-us-what-card__image" src={image} alt="" loading="lazy" />
              </div>
              <div className="about-us-what-card__body">
                <h3 className="about-us-what-card__title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`about:whatWeDo.${i18nKey}.title`))}
                </h3>
                <p className="about-us-what-card__text">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], description, t(`about:whatWeDo.${i18nKey}.description`))}
                </p>
                <Link className="about-us-what-card__link" to={overrides[`${overrideKey}Link`] || to}>
                  {t("about:whatWeDo.exploreMore")}
                  <IconArrowRight size={16} stroke={2} aria-hidden />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
