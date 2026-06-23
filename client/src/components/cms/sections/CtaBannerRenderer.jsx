import GetInvolvedSection from "../../home/GetInvolvedSection.jsx";
import CmsCtaButtons from "../CmsCtaButtons.jsx";

export default function CtaBannerRenderer({ section }) {
  const { content = {}, settings = {} } = section;
  const bg = section.images?.background;

  if (section.sectionKey === "get-involved" && !content.heading) {
    return <GetInvolvedSection />;
  }

  return (
    <section
      className="cms-cta-banner"
      style={{
        backgroundColor: settings.backgroundColor,
        backgroundImage: bg?.url ? `url(${bg.url})` : undefined,
        textAlign: settings.textAlign || "center",
      }}
    >
      <div className="cms-cta-banner__overlay" style={{ opacity: (settings.overlayStrength ?? 50) / 100 }} />
      <div className="cms-cta-banner__content">
        {content.heading ? <h2>{content.heading}</h2> : null}
        {content.description ? <p>{content.description}</p> : null}
        <CmsCtaButtons ctas={section.ctas} />
      </div>
    </section>
  );
}
