import { useTranslation } from "react-i18next";
import { IconArrowRight, IconBrandWhatsapp } from "@tabler/icons-react";
import { POLICIES_HELP } from "../../data/policiesDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function PoliciesHelpSection() {
  const { t } = useTranslation(["policies"]);
  const overrides = useContentOverrides();
  const { image } = POLICIES_HELP;

  return (
    <section className="policies-help" aria-labelledby="policies-help-title">
      <div className="policies-help__card">
        <img className="policies-help__bg" src={image} alt="" aria-hidden="true" loading="lazy" />
        <div className="policies-help__overlay" aria-hidden="true" />

        <div className="policies-help__content">
          <h2 id="policies-help-title" className="policies-help__title">
            {resolveOverrideText(overrides.policiesHelpTitle, POLICIES_HELP.title, t("policies:help.title"))}
          </h2>
          <p className="policies-help__description">
            {resolveOverrideText(overrides.policiesHelpDescription, POLICIES_HELP.description, t("policies:help.description"))}
          </p>
          <a
            className="policies-help__button"
            href={overrides.policiesHelpButtonLink || POLICIES_HELP.buttonHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp size={20} stroke={1.6} aria-hidden />
            {resolveOverrideText(overrides.policiesHelpButtonText, POLICIES_HELP.buttonLabel, t("policies:help.buttonLabel"))}
            <IconArrowRight size={16} stroke={2} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
