import { useTranslation } from "react-i18next";
import { IconArrowRight, IconGift, IconHeartHandshake, IconUsersGroup } from "@tabler/icons-react";
import { DONATION_OTHER_WAYS } from "../../data/donateTiersDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import "../../styles/donate-other-ways-section.css";

const OTHER_WAY_ICONS = {
  handshake: IconHeartHandshake,
  gift: IconGift,
  volunteer: IconUsersGroup,
};

export default function DonateOtherWaysSection() {
  const { t } = useTranslation(["donate"]);
  const overrides = useContentOverrides();

  return (
    <section
      id="donate-other-ways"
      className="donate-other-ways-section"
      aria-labelledby="donate-other-ways-title"
    >
      <div className="donate-other-ways-section__inner">
        <h2 id="donate-other-ways-title" className="donate-other-ways-section__title">
          {resolveOverrideText(overrides.donateOtherWaysHeading, "Other Ways to Give", t("donate:otherWays.heading"))}
        </h2>

        <div className="donate-other-ways-section__grid" role="list">
          {DONATION_OTHER_WAYS.map(({ title, text, icon, href }, index) => {
            const Icon = OTHER_WAY_ICONS[icon] || IconGift;
            const overrideKey = `donateOtherWay${index + 1}`;
            const itemKey = `item${index + 1}`;

            return (
              <article key={title} className="donate-other-ways-section__card" role="listitem">
                <span className="donate-other-ways-section__icon-wrap" aria-hidden="true">
                  <Icon className="donate-other-ways-section__icon" stroke={1.5} />
                </span>
                <div className="donate-other-ways-section__body">
                  <h3 className="donate-other-ways-section__card-title">
                    {resolveOverrideText(overrides[`${overrideKey}Title`], title, t(`donate:otherWays.${itemKey}.title`))}
                  </h3>
                  <p className="donate-other-ways-section__card-text">
                    {resolveOverrideText(overrides[`${overrideKey}Description`], text, t(`donate:otherWays.${itemKey}.description`))}
                  </p>
                  <a className="donate-other-ways-section__link" href={overrides[`${overrideKey}Link`] || href}>
                    {t("donate:otherWays.learnMore")}
                    <IconArrowRight size={16} stroke={2} aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
