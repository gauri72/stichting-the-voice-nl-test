import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { STORIES_CTA } from "../../data/storiesDisplay.js";

export default function StoriesCtaSection() {
  const {
    lineOneLead,
    lineOneAccent,
    lineTwoLead,
    lineTwoAccent,
    subtext,
    buttonLabel,
    buttonTo,
    background,
    logo,
  } = STORIES_CTA;

  return (
    <section className="stories-cta" aria-labelledby="stories-cta-title">
      <img className="stories-cta__bg" src={background} alt="" aria-hidden="true" loading="lazy" />
      <div className="stories-cta__overlay" aria-hidden="true" />

      <div className="stories-cta__inner">
        {logo ? (
          <img className="stories-cta__logo" src={logo} alt="Stichting The V.O.I.C.E. NL" loading="lazy" />
        ) : null}
        <h2 id="stories-cta-title" className="stories-cta__title">
          <span className="stories-cta__title-line">
            {lineOneLead}
            <span className="stories-cta__accent stories-cta__accent--teal">{lineOneAccent}</span>
          </span>
          <span className="stories-cta__title-line">
            {lineTwoLead}
            <span className="stories-cta__accent stories-cta__accent--purple">{lineTwoAccent}</span>
          </span>
        </h2>
        <p className="stories-cta__subtext">{subtext}</p>
        <Link to={buttonTo} className="stories-cta__button">
          {buttonLabel}
          <IconArrowRight size={18} stroke={2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
