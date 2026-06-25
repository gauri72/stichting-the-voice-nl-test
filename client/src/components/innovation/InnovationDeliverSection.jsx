import { useTranslation } from "react-i18next";
import {
  IconShieldCheck,
  IconTarget,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { INNOVATION_DELIVER } from "../../data/innovationDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const DELIVER_ICONS = {
  target: IconTarget,
  people: IconUsersGroup,
  globe: IconWorld,
  shield: IconShieldCheck,
};

export default function InnovationDeliverSection() {
  const { t } = useTranslation(["innovation"]);
  const overrides = useContentOverrides();

  return (
    <section className="innovation-deliver" aria-labelledby="innovation-deliver-title">
      <h2 id="innovation-deliver-title" className="innovation-section-title">
        {resolveOverrideText(overrides.ventureDeliverHeading, "What We Deliver", t("innovation:deliver.heading"))}
      </h2>

      <div className="innovation-deliver__grid" role="list">
        {INNOVATION_DELIVER.map(({ key, icon, title, description }, index) => {
          const Icon = DELIVER_ICONS[icon] || IconTarget;
          const overrideKey = `ventureDeliver${index + 1}`;
          const itemKey = `item${index + 1}`;

          return (
            <div key={key} className="innovation-deliver__item" role="listitem">
              <span className="innovation-deliver__icon" aria-hidden="true">
                <Icon size={26} stroke={1.5} />
              </span>
              <div className="innovation-deliver__copy">
                <h3 className="innovation-deliver__title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`innovation:deliver.${itemKey}.title`))}
                </h3>
                <p className="innovation-deliver__text">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], description, t(`innovation:deliver.${itemKey}.description`))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
