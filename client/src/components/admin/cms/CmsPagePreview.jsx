import PageSectionRenderer from "../../cms/PageSectionRenderer.jsx";

export default function CmsPagePreview({ sections = [], mode = "desktop" }) {
  return (
    <div className={`admin-cms__preview admin-cms__preview--${mode}`}>
      <div className="admin-cms__preview-frame">
        <PageSectionRenderer sections={sections.filter((s) => s.isVisible !== false)} preview />
      </div>
    </div>
  );
}
