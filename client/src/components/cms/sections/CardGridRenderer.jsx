import CmsCtaButtons from "../CmsCtaButtons.jsx";

export default function CardGridRenderer({ section }) {
  const { content = {} } = section;
  const cards = content.cards || [];

  return (
    <section className="cms-card-grid">
      {content.heading ? <h2 className="cms-section-heading">{content.heading}</h2> : null}
      <div className="cms-card-grid__grid">
        {cards.map((card, i) => (
          <article key={card.id || i} className="cms-card-grid__card">
            {card.image?.url ? <img src={card.image.url} alt={card.image.alt || card.title || ""} /> : null}
            {card.title ? <h3>{card.title}</h3> : null}
            {card.description ? <p>{card.description}</p> : null}
          </article>
        ))}
      </div>
      <CmsCtaButtons ctas={section.ctas} />
    </section>
  );
}
