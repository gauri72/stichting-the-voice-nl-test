import CmsImageField from "./CmsImageField.jsx";

export default function CmsSeoPanel({ seo = {}, onChange, readOnly = false }) {
  function set(field, value) {
    onChange({ ...seo, [field]: value });
  }

  return (
    <div className="admin-cms__seo-panel">
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Meta title</label>
        <input className="admin-cms__input" value={seo.metaTitle || ""} onChange={(e) => set("metaTitle", e.target.value)} disabled={readOnly} maxLength={200} />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Meta description</label>
        <textarea className="admin-cms__textarea" rows={3} value={seo.metaDescription || ""} onChange={(e) => set("metaDescription", e.target.value)} disabled={readOnly} maxLength={500} />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Open Graph title</label>
        <input className="admin-cms__input" value={seo.ogTitle || ""} onChange={(e) => set("ogTitle", e.target.value)} disabled={readOnly} />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Open Graph description</label>
        <textarea className="admin-cms__textarea" rows={2} value={seo.ogDescription || ""} onChange={(e) => set("ogDescription", e.target.value)} disabled={readOnly} />
      </div>
      <CmsImageField label="Open Graph image" value={seo.ogImage} onChange={(val) => set("ogImage", val)} imageType="og" disabled={readOnly} />
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">Canonical URL</label>
        <input className="admin-cms__input" value={seo.canonicalUrl || ""} onChange={(e) => set("canonicalUrl", e.target.value)} disabled={readOnly} placeholder="https://..." />
      </div>
      <div className="admin-cms__field-row">
        <label className="admin-cms__label">SEO keywords (optional)</label>
        <input className="admin-cms__input" value={seo.keywords || ""} onChange={(e) => set("keywords", e.target.value)} disabled={readOnly} />
      </div>
      <label className="admin-cms__checkbox">
        <input type="checkbox" checked={seo.robotsIndex !== false} onChange={(e) => set("robotsIndex", e.target.checked)} disabled={readOnly} />
        Allow search engines to index this page
      </label>
    </div>
  );
}
