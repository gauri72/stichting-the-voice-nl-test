import { sanitizeHtml } from "../../../utils/sanitizeHtml.js";

export default function CustomHtmlRenderer({ section }) {
  const html = section.content?.customHtml || section.content?.richText || "";
  if (!html) return null;
  return (
    <section className="cms-custom-html">
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </section>
  );
}
