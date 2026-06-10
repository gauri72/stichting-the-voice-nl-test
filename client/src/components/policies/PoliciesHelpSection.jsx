import { IconArrowRight, IconBrandWhatsapp } from "@tabler/icons-react";
import { POLICIES_HELP } from "../../data/policiesDisplay.js";

export default function PoliciesHelpSection() {
  const { image, title, description, buttonLabel, buttonHref } = POLICIES_HELP;

  return (
    <section className="policies-help" aria-labelledby="policies-help-title">
      <div className="policies-help__card">
        <img className="policies-help__bg" src={image} alt="" aria-hidden="true" loading="lazy" />
        <div className="policies-help__overlay" aria-hidden="true" />

        <div className="policies-help__content">
          <h2 id="policies-help-title" className="policies-help__title">
            {title}
          </h2>
          <p className="policies-help__description">{description}</p>
          <a
            className="policies-help__button"
            href={buttonHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp size={20} stroke={1.6} aria-hidden />
            {buttonLabel}
            <IconArrowRight size={16} stroke={2} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
