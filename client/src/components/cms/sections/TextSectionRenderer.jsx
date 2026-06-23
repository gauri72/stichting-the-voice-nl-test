import CmsCtaButtons from "../CmsCtaButtons.jsx";

export default function TextSectionRenderer({ section }) {
  const { content = {}, settings = {} } = section;
  const align = settings.textAlign || "left";

  return (
    <section className="cms-text-section" style={{ textAlign: align, backgroundColor: settings.backgroundColor }}>
      <div className="cms-text-section__inner">
        {content.heading ? <h2>{content.heading}</h2> : null}
        {content.subheading ? <h3>{content.subheading}</h3> : null}
        {content.description ? <p>{content.description}</p> : null}
        {content.longContent ? <div className="cms-text-section__long">{content.longContent}</div> : null}
        {content.richText ? <div className="cms-text-section__rich" dangerouslySetInnerHTML={{ __html: content.richText }} /> : null}
        {content.bullets?.length ? (
          <ul>{content.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
        ) : null}
        <CmsCtaButtons ctas={section.ctas} />
      </div>
    </section>
  );
}
