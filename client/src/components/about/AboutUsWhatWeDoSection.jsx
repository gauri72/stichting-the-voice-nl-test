import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { ABOUT_WHAT_WE_DO } from "../../data/aboutUsDisplay.js";

export default function AboutUsWhatWeDoSection() {
  return (
    <section className="about-us-what-we-do" aria-labelledby="about-us-what-we-do-title">
      <h2 id="about-us-what-we-do-title" className="about-us-section-title">
        What We Do
      </h2>

      <div className="about-us-what-we-do__grid" role="list">
        {ABOUT_WHAT_WE_DO.map(({ title, description, image, to, accent }) => (
          <article
            key={title}
            className={`about-us-what-card about-us-what-card--${accent}`}
            role="listitem"
          >
            <div className="about-us-what-card__media">
              <img className="about-us-what-card__image" src={image} alt="" loading="lazy" />
            </div>
            <div className="about-us-what-card__body">
              <h3 className="about-us-what-card__title">{title}</h3>
              <p className="about-us-what-card__text">{description}</p>
              <Link className="about-us-what-card__link" to={to}>
                Explore More
                <IconArrowRight size={16} stroke={2} aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
