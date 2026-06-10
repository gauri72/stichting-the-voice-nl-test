import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { IMPACT_JOIN_CTA } from "../../data/impactDisplay.js";

export default function ImpactJoinCtaSection() {
  const { image, titleLead, titleAccent, description, buttonLabel, buttonTo } =
    IMPACT_JOIN_CTA;

  return (
    <section className="impact-join" aria-labelledby="impact-join-title">
      <div className="impact-join__card">
        <div className="impact-join__media">
          <img src={image} alt="" loading="lazy" />
        </div>

        <div className="impact-join__body">
          <h2 id="impact-join-title" className="impact-join__title">
            {titleLead}
            <span className="impact-accent--teal">{titleAccent}</span>
          </h2>
          <p className="impact-join__description">{description}</p>
          <Link to={buttonTo} className="impact-join__button">
            {buttonLabel}
            <IconArrowRight size={18} stroke={2} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
