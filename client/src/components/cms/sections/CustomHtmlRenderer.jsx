export default function CustomHtmlRenderer({ section }) {
  const html = section.content?.customHtml || section.content?.richText || "";
  if (!html) return null;
  return (
    <section className="cms-custom-html">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
