import { useTranslation } from "react-i18next";
import {
  IconBolt,
  IconMasksTheater,
  IconMoodSmileBeam,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { DONATION_STATS } from "../../data/donateTiersDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/donate-real-impact-section.css";

const STAT_ICONS = {
  bolt: IconBolt,
  masks: IconMasksTheater,
  star: IconStar,
  users: IconUsers,
  smile: IconMoodSmileBeam,
};

export default function DonateRealImpactSection() {
  const { t } = useTranslation(["donate"]);
  const overrides = useContentOverrides();

  return (
    <section className="donate-impact-section" aria-labelledby="donate-impact-title">
      <div className="donate-impact-section__inner">
        <h2 id="donate-impact-title" className="donate-impact-section__title">
          <span className="donate-impact-section__title-line">
            {resolveOverrideText(overrides.donateImpactTitleLine, "Real Impact.", t("donate:impact.titleLine"))}
          </span>
          <span className="donate-impact-section__title-accent">
            {resolveOverrideText(overrides.donateImpactTitleAccent, "Real Change.", t("donate:impact.titleAccent"))}
          </span>
        </h2>

        <ul className="donate-impact-section__stats" role="list">
          {DONATION_STATS.map(({ value, label, icon }, index) => {
            const Icon = STAT_ICONS[icon] || IconStar;
            const overrideKey = `donateStat${index + 1}`;
            const statKey = `stat${index + 1}`;

            return (
              <li key={label} className="donate-impact-section__stat" role="listitem">
                <span className="donate-impact-section__stat-icon-wrap" aria-hidden="true">
                  <Icon className="donate-impact-section__stat-icon" stroke={1.5} />
                </span>
                <div className="donate-impact-section__stat-text">
                  <span className="donate-impact-section__stat-value">{overrides[`${overrideKey}Value`] || value}</span>
                  <span className="donate-impact-section__stat-label">
                    {resolveOverrideText(overrides[`${overrideKey}Label`], label, t(`donate:impact.${statKey}`))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
