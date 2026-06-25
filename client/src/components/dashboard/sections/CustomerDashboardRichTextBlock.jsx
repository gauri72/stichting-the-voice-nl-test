import { sanitizeHtml } from "../../../utils/sanitizeHtml.js";

export default function CustomerDashboardRichTextBlock({ section }) {
  const html = section?.settings?.richText || section?.description || "";
  if (!html) return null;

  const align = section?.settings?.textAlign || "left";

  return (
    <section className="member-dashboard__rich-text" style={{ textAlign: align }}>
      {section?.title ? <h2 className="member-dashboard__section-title">{section.title}</h2> : null}
      {section?.subtitle ? <p className="member-dashboard__section-subtitle">{section.subtitle}</p> : null}
      <div className="member-dashboard__rich-text-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </section>
  );
}
