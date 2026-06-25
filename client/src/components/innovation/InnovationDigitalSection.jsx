import { useTranslation } from "react-i18next";
import {
  IconBulb,
  IconChartBar,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { INNOVATION_DIGITAL } from "../../data/innovationDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const PILLAR_ICONS = {
  globe: IconWorld,
  chart: IconChartBar,
  people: IconUsersGroup,
  bulb: IconBulb,
};

export default function InnovationDigitalSection() {
  const { t } = useTranslation(["innovation"]);
  const overrides = useContentOverrides();
  const { brandMark, brandName, pillars } = INNOVATION_DIGITAL;

  return (
    <section className="innovation-digital" aria-labelledby="innovation-digital-title">
      <div className="innovation-digital__card">
        <div className="innovation-digital__top">
          <div className="innovation-digital__brand">
            <span className="innovation-digital__brand-mark">{brandMark}</span>
            <span className="innovation-digital__brand-name">{brandName}</span>
          </div>

          <div className="innovation-digital__divider" aria-hidden="true" />

          <div className="innovation-digital__intro">
            <h2 id="innovation-digital-title" className="innovation-digital__title">
              {resolveOverrideText(overrides.ventureDigitalTitle, INNOVATION_DIGITAL.title, t("innovation:digital.title"))}
            </h2>
            <p className="innovation-digital__description">
              {resolveOverrideText(overrides.ventureDigitalDescription, INNOVATION_DIGITAL.description, t("innovation:digital.description"))}
            </p>
          </div>
        </div>

        <div className="innovation-digital__pillars" role="list">
          {pillars.map(({ key, icon, label }, index) => {
            const Icon = PILLAR_ICONS[icon] || IconBulb;
            const overrideKey = `ventureDigitalPillar${index + 1}`;
            const pillarKey = `pillar${index + 1}`;

            return (
              <div key={key} className="innovation-digital__pillar" role="listitem">
                <span className="innovation-digital__pillar-icon" aria-hidden="true">
                  <Icon size={28} stroke={1.5} />
                </span>
                <p className="innovation-digital__pillar-label">
                  {resolveOverrideText(overrides[`${overrideKey}Label`], label, t(`innovation:digital.${pillarKey}`))}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
