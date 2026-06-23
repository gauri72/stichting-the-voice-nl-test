import OurPillarsSection from "../../home/OurPillarsSection.jsx";
import CmsCtaButtons from "../CmsCtaButtons.jsx";

export default function FeatureCardsRenderer({ section }) {
  const { content = {} } = section;
  const cards = content.cards || [];

  if (!cards.length && section.sectionKey === "pillars") {
    return <OurPillarsSection />;
  }

  return (
    <section className="cms-feature-cards">
      {content.heading ? <h2 className="cms-section-heading">{content.heading}</h2> : null}
      <div className="cms-feature-cards__grid">
        {cards.map((card, i) => (
          <article key={card.id || i} className="cms-feature-cards__card">
            {card.icon?.url ? <img src={card.icon.url} alt="" className="cms-feature-cards__icon" /> : null}
            {card.title ? <h3>{card.title}</h3> : null}
            {card.description ? <p>{card.description}</p> : null}
          </article>
        ))}
      </div>
      <CmsCtaButtons ctas={section.ctas} />
    </section>
  );
}
