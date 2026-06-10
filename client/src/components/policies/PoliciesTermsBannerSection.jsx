import { IconArrowRight, IconFileDescription } from "@tabler/icons-react";
import { POLICIES_TERMS } from "../../data/policiesDisplay.js";

export default function PoliciesTermsBannerSection() {
  const { id, title, description, buttonLabel, anchor } = POLICIES_TERMS;

  return (
    <section id={id} className="policies-terms-banner" aria-labelledby="policies-terms-banner-title">
      <div className="policies-terms-banner__card">
        <span className="policies-terms-banner__icon" aria-hidden="true">
          <IconFileDescription size={30} stroke={1.5} />
        </span>

        <div className="policies-terms-banner__copy">
          <h2 id="policies-terms-banner-title" className="policies-terms-banner__title">
            {title}
          </h2>
          <p className="policies-terms-banner__description">{description}</p>
        </div>

        <a href={`#${anchor}`} className="policies-terms-banner__button">
          {buttonLabel}
          <IconArrowRight size={18} stroke={2} aria-hidden />
        </a>
      </div>
    </section>
  );
}
