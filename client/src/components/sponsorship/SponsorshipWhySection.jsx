import { useTranslation } from "react-i18next";
import {
  IconChartLine,
  IconHeartHandshake,
  IconSpeakerphone,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { SPONSORSHIP_WHY_REASONS } from "../../data/sponsorshipTiersDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/sponsorship-why-section.css";

const REASON_ICONS = {
  users: IconUsers,
  globe: IconWorld,
  bullhorn: IconSpeakerphone,
  handshake: IconHeartHandshake,
  chart: IconChartLine,
};

export default function SponsorshipWhySection() {
  const { t } = useTranslation(["sponsorship"]);
  const overrides = useContentOverrides();

  return (
    <section
      id="sponsorship-why"
      className="sponsorship-why-section"
      aria-labelledby="sponsorship-why-title"
    >
      <div className="sponsorship-why-section__inner">
        <h2 id="sponsorship-why-title" className="sponsorship-why-section__title">
          {resolveOverrideText(overrides.sponsorshipWhyHeading, "Why Sponsor Stichting The V.O.I.C.E. NL?", t("sponsorship:why.heading"))}
        </h2>

        <div className="sponsorship-why-section__grid" role="list" aria-label="Reasons to sponsor">
          {SPONSORSHIP_WHY_REASONS.map(({ title, text, icon }, index) => {
            const Icon = REASON_ICONS[icon] || IconUsers;
            const overrideKey = `sponsorWhy${index + 1}`;
            const reasonKey = `reason${index + 1}`;

            return (
              <article key={index} className="sponsorship-why-section__item" role="listitem">
                <span className="sponsorship-why-section__icon-wrap" aria-hidden="true">
                  <Icon className="sponsorship-why-section__icon" stroke={1.5} />
                </span>
                <h3 className="sponsorship-why-section__item-title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`sponsorship:why.${reasonKey}.title`))}
                </h3>
                <p className="sponsorship-why-section__item-text">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], text, t(`sponsorship:why.${reasonKey}.description`))}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
