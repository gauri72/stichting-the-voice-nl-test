import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight } from "@tabler/icons-react";
import { INNOVATION_CTA } from "../../data/innovationDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

export default function InnovationCtaSection() {
  const { t } = useTranslation(["innovation"]);
  const overrides = useContentOverrides();
  const { image } = INNOVATION_CTA;

  return (
    <section className="innovation-cta" aria-labelledby="innovation-cta-title">
      <div className="innovation-cta__card">
        <div className="innovation-cta__media">
          <img src={image} alt="" loading="lazy" />
        </div>

        <div className="innovation-cta__body">
          <h2 id="innovation-cta-title" className="innovation-cta__title">
            {resolveOverrideText(overrides.ventureCtaTitleLead, INNOVATION_CTA.titleLead, t("innovation:cta.titleLead"))}
            <span className="innovation-accent--cyan">
              {resolveOverrideText(overrides.ventureCtaTitleAccent, INNOVATION_CTA.titleAccent, t("innovation:cta.titleAccent"))}
            </span>
          </h2>
          <p className="innovation-cta__description">
            {resolveOverrideText(overrides.ventureCtaDescription, INNOVATION_CTA.description, t("innovation:cta.description"))}
          </p>
          <Link to={overrides.ventureCtaButtonLink || INNOVATION_CTA.buttonTo} className="innovation-cta__button cta-pulse">
            {resolveOverrideText(overrides.ventureCtaButtonText, INNOVATION_CTA.buttonLabel, t("innovation:cta.buttonLabel"))}
            <IconArrowRight size={18} stroke={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
