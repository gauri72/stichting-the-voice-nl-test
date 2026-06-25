import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconBulb,
  IconHeartHandshake,
  IconMicrophone,
  IconPresentation,
} from "@tabler/icons-react";
import { TABLER_ICON_STROKE } from "../../constants/homeIcons.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/our-pillars-section.css";

const ArrowIcon = IconArrowRight;

const pillars = [
  {
    overrideKey: "pillar1",
    i18nKey: "experience",
    mobileTitleEn: "Experience",
    desktopTitleEn: "V.O.I.C.E. Experience",
    desktopLeadEn: "Creating unforgettable cultural experiences.",
    desktopTagsEn: "Events • Festivals • Music • Dance • Sports",
    to: "/events",
    accent: "teal",
    Icon: IconPresentation,
  },
  {
    overrideKey: "pillar2",
    i18nKey: "stories",
    mobileTitleEn: "Stories",
    desktopTitleEn: "V.O.I.C.E. Stories",
    desktopLeadEn: "Sharing voices through Vision Of Sounds.",
    desktopTagsEn: "Podcast • Voice Of Visionaries • Media • Photography • Interviews",
    to: "/segments/vision-of-sounds",
    accent: "magenta",
    Icon: IconMicrophone,
  },
  {
    overrideKey: "pillar3",
    i18nKey: "impact",
    mobileTitleEn: "Impact",
    desktopTitleEn: "V.O.I.C.E. Impact",
    desktopLeadEn: "VOWNL • Social Work • Empowering communities through action.",
    desktopTagsEn: "Youth • Inclusion • Education • Volunteering",
    to: "/segments/vownl",
    accent: "gold",
    Icon: IconHeartHandshake,
  },
  {
    overrideKey: "pillar4",
    i18nKey: "innovation",
    mobileTitleEn: "Innovation",
    desktopTitleEn: "V.O.I.C.E. Innovation",
    desktopLeadEn: "Building the future through technology.",
    desktopTagsEn: "V.O.I.C.E. Digital • Apps • Websites • V.O.I.C.E. Venture Studio",
    to: "/voice-venture-studio",
    accent: "blue",
    Icon: IconBulb,
  },
];

export default function OurPillarsSection({ title, sectionClassName = "" }) {
  const { t } = useTranslation(["home"]);
  const overrides = useContentOverrides();
  const resolvedTitle = title || t("home:pillars.title");

  return (
    <section
      className={`our-pillars-section${sectionClassName ? ` ${sectionClassName}` : ""}`}
      aria-labelledby="our-pillars-title"
    >
      <div className="our-pillars-section__inner">
        <div className="our-pillars-section__heading">
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
          <h2 id="our-pillars-title" className="our-pillars-section__title">
            {resolvedTitle}
          </h2>
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
        </div>

        <div className="our-pillars-grid" role="list">
          {pillars.map(
            (
              { overrideKey, i18nKey, mobileTitleEn, desktopTitleEn, desktopLeadEn, desktopTagsEn, to, accent, Icon },
              index
            ) => {
              const mobileTitle = t(`home:pillars.${i18nKey}.mobileTitle`);
              const title2 = resolveOverrideText(
                overrides[`${overrideKey}Title`],
                desktopTitleEn,
                t(`home:pillars.${i18nKey}.desktopTitle`)
              );
              const lead = resolveOverrideText(
                overrides[`${overrideKey}Description`],
                desktopLeadEn,
                t(`home:pillars.${i18nKey}.lead`)
              );
              const link = overrides[`${overrideKey}Link`] || to;
              return (
                <article
                  key={i18nKey}
                  className={`our-pillars-item our-pillars-item--${accent}${
                    index < pillars.length - 1 ? " our-pillars-item--divided" : ""
                  }`}
                  role="listitem"
                >
                  <div className="our-pillars-item__icon" aria-hidden="true">
                    <Icon className="our-pillars-item__icon-svg" stroke={TABLER_ICON_STROKE} />
                  </div>

                  <h3 className="our-pillars-item__title our-pillars-item__title--mobile">
                    {mobileTitle}
                  </h3>
                  <h3 className="our-pillars-item__title our-pillars-item__title--desktop">
                    {title2}
                  </h3>

                  <div className="our-pillars-item__description">
                    <p className="our-pillars-item__lead">{lead}</p>
                    <p className="our-pillars-item__tags">{t(`home:pillars.${i18nKey}.tags`)}</p>
                  </div>

                  <Link className="our-pillars-item__link" to={link}>
                    {t("home:pillars.learnMore")}
                    <ArrowIcon aria-hidden stroke={TABLER_ICON_STROKE} />
                  </Link>
                </article>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}
