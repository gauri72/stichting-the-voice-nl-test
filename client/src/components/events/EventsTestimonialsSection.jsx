import { useMemo, useState } from "react";
import teamOne from "../../assets/Home/team/team-1.png";
import teamFour from "../../assets/Home/team/team-4.png";
import teamSix from "../../assets/Home/team/team-6.png";
import teamEight from "../../assets/Home/team/team-8.png";
import "../../styles/donate-section-heading.css";
import "../../styles/events-testimonials-section.css";

const testimonials = [
  {
    quote:
      "Every V.O.I.C.E. event feels like coming home — the energy, the diversity, and the warmth are unmatched.",
    name: "Ayesha Khan",
    role: "Attendee",
    image: teamOne,
  },
  {
    quote:
      "Volunteering here taught me how culture can unite people from every background. I keep coming back every season.",
    name: "Priya Sharma",
    role: "Volunteer",
    image: teamEight,
  },
  {
    quote:
      "Partnering with this foundation opened doors for our artists and gave our community a stage we never had before.",
    name: "Marco van Dijk",
    role: "Community Partner",
    image: teamFour,
  },
  {
    quote:
      "The festivals bring together generations and cultures in a way that feels truly meaningful and inclusive.",
    name: "James Okonkwo",
    role: "Event Partner",
    image: teamSix,
  },
];

export default function EventsTestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleCards = useMemo(() => {
    const count = testimonials.length;
    return [0, 1, 2].map((offset) => testimonials[(activeIndex + offset) % count]);
  }, [activeIndex]);

  return (
    <section className="events-testimonials" aria-labelledby="events-testimonials-title">
      <div className="events-testimonials__inner">
        <header className="donate-section__header events-testimonials__header">
          <p className="donate-section__eyebrow">Community Voices</p>
          <div className="donate-section__heading">
            <span className="donate-section__heading-line" aria-hidden="true" />
            <h2 id="events-testimonials-title" className="donate-section__title events-testimonials__title">
              Voices from <span className="events-testimonials__title-accent">Our Community</span>
            </h2>
            <span className="donate-section__heading-line" aria-hidden="true" />
          </div>
        </header>

        <div className="events-testimonials__carousel" role="list" aria-label="Community testimonials">
          {visibleCards.map(({ quote, name, role, image }, index) => (
            <article
              key={`${name}-${activeIndex}-${index}`}
              className="events-testimonials__card"
              role="listitem"
            >
              <img className="events-testimonials__avatar" src={image} alt="" />
              <div className="events-testimonials__content">
                <span className="events-testimonials__quote-mark" aria-hidden="true">
                  &ldquo;&rdquo;
                </span>
                <blockquote>
                  <p>{quote}</p>
                </blockquote>
                <footer>
                  <cite>— {name}</cite>
                  <span>{role}</span>
                </footer>
              </div>
            </article>
          ))}
        </div>

        <div className="events-testimonials__dots" role="tablist" aria-label="Testimonial slides">
          {testimonials.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show testimonials starting with ${item.name}`}
              className={`events-testimonials__dot ${
                index === activeIndex ? "events-testimonials__dot--active" : ""
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
