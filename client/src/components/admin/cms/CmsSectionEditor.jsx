import CmsImageField from "./CmsImageField.jsx";
import CmsCtaEditor from "./CmsCtaEditor.jsx";
import { formatSectionType } from "../../../utils/pagesAdmin.js";

export default function CmsSectionEditor({ section, onChange, config, readOnly = false }) {
  if (!section) {
    return <p className="admin-cms__empty">Select a section to edit.</p>;
  }

  const content = section.content || {};
  const images = section.images || {};
  const settings = section.settings || {};
  const guidance = config?.imageGuidance || {};

  function setContent(field, value) {
    onChange({ ...section, content: { ...content, [field]: value } });
  }

  function setImage(field, value) {
    onChange({ ...section, images: { ...images, [field]: value } });
  }

  function setSetting(field, value) {
    onChange({ ...section, settings: { ...settings, [field]: value } });
  }

  return (
    <div className="admin-cms__section-editor">
      <header className="admin-cms__section-editor-header">
        <h3>{section.title || formatSectionType(section.sectionType)}</h3>
        <span className="admin-cms__badge">{formatSectionType(section.sectionType)}</span>
      </header>

      <details className="admin-cms__accordion" open>
        <summary>Content</summary>
        <div className="admin-cms__accordion-body">
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Section title</label>
            <input className="admin-cms__input" value={section.title || ""} onChange={(e) => onChange({ ...section, title: e.target.value })} disabled={readOnly} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Heading</label>
            <input className="admin-cms__input" value={content.heading || ""} onChange={(e) => setContent("heading", e.target.value)} disabled={readOnly} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Subheading</label>
            <input className="admin-cms__input" value={content.subheading || ""} onChange={(e) => setContent("subheading", e.target.value)} disabled={readOnly} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Short description</label>
            <textarea className="admin-cms__textarea" rows={3} value={content.description || ""} onChange={(e) => setContent("description", e.target.value)} disabled={readOnly} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Long content</label>
            <textarea className="admin-cms__textarea" rows={5} value={content.longContent || ""} onChange={(e) => setContent("longContent", e.target.value)} disabled={readOnly} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Rich text / HTML</label>
            <textarea className="admin-cms__textarea admin-cms__textarea--code" rows={6} value={content.richText || content.customHtml || ""} onChange={(e) => setContent(section.sectionType === "custom_html" ? "customHtml" : "richText", e.target.value)} disabled={readOnly} />
          </div>
          {(content.bullets || section.sectionType === "faq") && (
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Bullet points (one per line)</label>
              <textarea
                className="admin-cms__textarea"
                rows={4}
                value={(content.bullets || []).join("\n")}
                onChange={(e) => setContent("bullets", e.target.value.split("\n").filter(Boolean))}
                disabled={readOnly}
              />
            </div>
          )}
        </div>
      </details>

      <details className="admin-cms__accordion" open>
        <summary>Images</summary>
        <div className="admin-cms__accordion-body">
          {["hero", "desktop", "mobile", "background", "icon", "card"].map((key) => (
            <CmsImageField
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1) + " image"}
              value={images[key]}
              onChange={(val) => setImage(key, val)}
              imageType={key === "hero" ? "hero" : key === "mobile" ? "mobile_hero" : key}
              guidance={guidance[key] || guidance.section || ""}
              disabled={readOnly}
            />
          ))}
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>CTA Links</summary>
        <div className="admin-cms__accordion-body">
          <CmsCtaEditor ctas={section.ctas || []} onChange={(ctas) => onChange({ ...section, ctas })} disabled={readOnly} />
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>Layout</summary>
        <div className="admin-cms__accordion-body">
          <div className="admin-cms__field-grid">
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Theme mode</label>
              <select className="admin-cms__select" value={settings.themeMode || "dark"} onChange={(e) => setSetting("themeMode", e.target.value)} disabled={readOnly}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Text alignment</label>
              <select className="admin-cms__select" value={settings.textAlign || "left"} onChange={(e) => setSetting("textAlign", e.target.value)} disabled={readOnly}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Image position</label>
              <select className="admin-cms__select" value={settings.imagePosition || "right"} onChange={(e) => setSetting("imagePosition", e.target.value)} disabled={readOnly}>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Background color</label>
              <input className="admin-cms__input" type="color" value={settings.backgroundColor || "#0a0a0f"} onChange={(e) => setSetting("backgroundColor", e.target.value)} disabled={readOnly} />
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Overlay strength</label>
              <input className="admin-cms__range" type="range" min="0" max="100" value={settings.overlayStrength ?? 50} onChange={(e) => setSetting("overlayStrength", Number(e.target.value))} disabled={readOnly} />
            </div>
          </div>
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>Visibility</summary>
        <div className="admin-cms__accordion-body">
          <label className="admin-cms__checkbox">
            <input type="checkbox" checked={section.isVisible !== false} onChange={(e) => onChange({ ...section, isVisible: e.target.checked })} disabled={readOnly} />
            Section visible on page
          </label>
        </div>
      </details>
    </div>
  );
}
