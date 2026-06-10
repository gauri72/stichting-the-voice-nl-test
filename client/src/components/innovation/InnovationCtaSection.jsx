import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { INNOVATION_CTA } from "../../data/innovationDisplay.js";

export default function InnovationCtaSection() {
  const { image, titleLead, titleAccent, description, buttonLabel, buttonTo } =
    INNOVATION_CTA;

  return (
    <section className="innovation-cta" aria-labelledby="innovation-cta-title">
      <div className="innovation-cta__card">
        <div className="innovation-cta__media">
          <img src={image} alt="" loading="lazy" />
        </div>

        <div className="innovation-cta__body">
          <h2 id="innovation-cta-title" className="innovation-cta__title">
            {titleLead}
            <span className="innovation-accent--cyan">{titleAccent}</span>
          </h2>
          <p className="innovation-cta__description">{description}</p>
          <Link to={buttonTo} className="innovation-cta__button">
            {buttonLabel}
            <IconArrowRight size={18} stroke={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
