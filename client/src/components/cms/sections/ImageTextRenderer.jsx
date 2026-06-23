import CmsCtaButtons from "../CmsCtaButtons.jsx";

export default function ImageTextRenderer({ section }) {
  const { content = {}, images = {}, settings = {} } = section;
  const img = images.desktop || images.hero || images.section || {};
  const position = settings.imagePosition || "right";
  const isLeft = position === "left";

  return (
    <section className={`cms-image-text cms-image-text--${position}`} style={{ backgroundColor: settings.backgroundColor }}>
      <div className="cms-image-text__inner">
        {img.url ? (
          <div className="cms-image-text__media" style={{ order: isLeft ? 0 : 2 }}>
            <img src={img.url} alt={img.alt || content.heading || ""} style={{ objectPosition: img.focusPosition || "center" }} />
          </div>
        ) : null}
        <div className="cms-image-text__content" style={{ order: 1 }}>
          {content.heading ? <h2>{content.heading}</h2> : null}
          {content.description ? <p>{content.description}</p> : null}
          {content.richText ? <div dangerouslySetInnerHTML={{ __html: content.richText }} /> : null}
          <CmsCtaButtons ctas={section.ctas} />
        </div>
      </div>
    </section>
  );
}
