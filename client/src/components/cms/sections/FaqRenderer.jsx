export default function FaqRenderer({ section }) {
  const items = section.content?.faqs || section.content?.bullets?.map((q, i) => ({ question: q, answer: "" })) || [];

  return (
    <section className="cms-faq">
      {section.content?.heading ? <h2>{section.content.heading}</h2> : null}
      <div className="cms-faq__list">
        {items.map((item, i) => (
          <details key={item.id || i} className="cms-faq__item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
