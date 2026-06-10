import { POLICIES_DETAILS, POLICIES_TERMS_CONTENT } from "../../data/policiesDisplay.js";

export default function PoliciesDetailSection() {
  return (
    <section className="policies-detail" aria-label="Policy and terms content">
      <div className="policies-detail__inner">
        {POLICIES_DETAILS.map(({ id, title, paragraphs }) => (
          <article key={id} id={id} className="policies-detail__block">
            <h2 className="policies-detail__title">{title}</h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="policies-detail__paragraph">
                {paragraph}
              </p>
            ))}
          </article>
        ))}

        <article id={POLICIES_TERMS_CONTENT.id} className="policies-detail__block policies-detail__block--terms">
          <h2 className="policies-detail__title">{POLICIES_TERMS_CONTENT.title}</h2>
          {POLICIES_TERMS_CONTENT.sections.map(({ heading, body }) => (
            <div key={heading} className="policies-detail__section">
              <h3 className="policies-detail__heading">{heading}</h3>
              <p className="policies-detail__paragraph">{body}</p>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
