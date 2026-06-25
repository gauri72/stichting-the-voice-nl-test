import { useTranslation } from "react-i18next";
import {
  IconHeart,
  IconLeaf,
  IconMusic,
  IconSchool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { DONATION_ALLOCATION } from "../../data/donateTiersDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/donate-allocation-section.css";

const ALLOCATION_ICONS = {
  music: IconMusic,
  users: IconUsers,
  school: IconSchool,
  heartbeat: IconHeart,
  globe: IconWorld,
  leaf: IconLeaf,
};

export default function DonateAllocationSection() {
  const { t } = useTranslation(["donate"]);
  const overrides = useContentOverrides();

  return (
    <section
      id="donate-allocation"
      className="donate-allocation-section"
      aria-labelledby="donate-allocation-title"
    >
      <div className="donate-allocation-section__inner">
        <h2 id="donate-allocation-title" className="donate-allocation-section__title">
          {resolveOverrideText(overrides.donateAllocationHeading, "Where Your Donation Goes", t("donate:allocation.heading"))}
        </h2>

        <div className="donate-allocation-section__grid" role="list">
          {DONATION_ALLOCATION.map(({ title, text, icon }, index) => {
            const Icon = ALLOCATION_ICONS[icon] || IconUsers;
            const overrideKey = `donateAllocation${index + 1}`;
            const itemKey = `item${index + 1}`;

            return (
              <article key={title} className="donate-allocation-section__item" role="listitem">
                <span className="donate-allocation-section__icon-wrap" aria-hidden="true">
                  <Icon className="donate-allocation-section__icon" stroke={1.5} />
                </span>
                <h3 className="donate-allocation-section__item-title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`donate:allocation.${itemKey}.title`))}
                </h3>
                <p className="donate-allocation-section__item-text">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], text, t(`donate:allocation.${itemKey}.description`))}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
