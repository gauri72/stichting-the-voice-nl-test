import { useTranslation } from "react-i18next";
import { IconArrowRight, IconFileDescription } from "@tabler/icons-react";
import { POLICIES_TERMS } from "../../data/policiesDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function PoliciesTermsBannerSection() {
  const { t } = useTranslation(["policies"]);
  const overrides = useContentOverrides();
  const { id, anchor } = POLICIES_TERMS;

  return (
    <section id={id} className="policies-terms-banner" aria-labelledby="policies-terms-banner-title">
      <div className="policies-terms-banner__card">
        <span className="policies-terms-banner__icon" aria-hidden="true">
          <IconFileDescription size={30} stroke={1.5} />
        </span>

        <div className="policies-terms-banner__copy">
          <h2 id="policies-terms-banner-title" className="policies-terms-banner__title">
            {resolveOverrideText(overrides.policiesTermsBannerTitle, POLICIES_TERMS.title, t("policies:termsBanner.title"))}
          </h2>
          <p className="policies-terms-banner__description">
            {resolveOverrideText(overrides.policiesTermsBannerDescription, POLICIES_TERMS.description, t("policies:termsBanner.description"))}
          </p>
        </div>

        <a href={`#${anchor}`} className="policies-terms-banner__button">
          {t("policies:termsBanner.buttonLabel")}
          <IconArrowRight size={18} stroke={2} aria-hidden />
        </a>
      </div>
    </section>
  );
}
