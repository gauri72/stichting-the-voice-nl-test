import CmsCtaEditor from "../cms/CmsCtaEditor.jsx";
import CmsImageField from "../cms/CmsImageField.jsx";
import { formatSectionType, formatVisibilityRule } from "../../../utils/customerDashboardAdmin.js";

export default function CustomerDashboardSectionEditor({ section, onChange, config, readOnly = false }) {
  if (!section) {
    return <p className="admin-cms__empty">Select a section to edit.</p>;
  }

  const settings = section.settings || {};
  const visibilityRules = section.visibilityRules?.rules || [];

  function setSetting(field, value) {
    onChange({ ...section, settings: { ...settings, [field]: value } });
  }

  function toggleVisibilityRule(rule) {
    const next = visibilityRules.includes(rule)
      ? visibilityRules.filter((r) => r !== rule)
      : [...visibilityRules, rule];
    onChange({ ...section, visibilityRules: { rules: next } });
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
            <input
              className="admin-cms__input"
              value={section.title || ""}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Subtitle</label>
            <input
              className="admin-cms__input"
              value={section.subtitle || ""}
              onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Description</label>
            <textarea
              className="admin-cms__textarea"
              rows={3}
              value={section.description || ""}
              onChange={(e) => onChange({ ...section, description: e.target.value })}
              disabled={readOnly}
            />
          </div>
          {section.sectionType === "welcome_banner" ? (
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Greeting text</label>
              <input
                className="admin-cms__input"
                value={settings.greeting || "Welcome,"}
                onChange={(e) => setSetting("greeting", e.target.value)}
                disabled={readOnly}
              />
            </div>
          ) : null}
          {section.sectionType === "custom_rich_text" ? (
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Rich text / HTML</label>
              <textarea
                className="admin-cms__textarea admin-cms__textarea--code"
                rows={6}
                value={settings.richText || ""}
                onChange={(e) => setSetting("richText", e.target.value)}
                disabled={readOnly}
              />
            </div>
          ) : null}
          {section.sectionType === "recent_activity" ? (
            <label className="admin-cms__checkbox">
              <input
                type="checkbox"
                checked={settings.showQuickActions !== false}
                onChange={(e) => setSetting("showQuickActions", e.target.checked)}
                disabled={readOnly}
              />
              Show quick action buttons
            </label>
          ) : null}
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>Image</summary>
        <div className="admin-cms__accordion-body">
          <CmsImageField
            label="Section image"
            value={section.imageUrl ? { url: section.imageUrl } : section.image}
            onChange={(val) => onChange({ ...section, imageUrl: val?.url || val || "", image: val })}
            imageType="section"
            disabled={readOnly}
          />
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>CTA Links</summary>
        <div className="admin-cms__accordion-body">
          <CmsCtaEditor
            ctas={section.ctas || []}
            onChange={(ctas) => onChange({ ...section, ctas })}
            disabled={readOnly}
          />
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>Visibility rules</summary>
        <div className="admin-cms__accordion-body admin-cms__checkbox-grid">
          {(config?.visibilityRules || []).map((rule) => (
            <label key={rule} className="admin-cms__checkbox">
              <input
                type="checkbox"
                checked={visibilityRules.includes(rule)}
                onChange={() => toggleVisibilityRule(rule)}
                disabled={readOnly}
              />
              {formatVisibilityRule(rule)}
            </label>
          ))}
          {!visibilityRules.length ? (
            <p className="admin-cms__hint">No rules selected — section shows to all logged-in users.</p>
          ) : null}
        </div>
      </details>

      <details className="admin-cms__accordion">
        <summary>Style</summary>
        <div className="admin-cms__accordion-body admin-cms__field-grid">
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Theme</label>
            <select
              className="admin-cms__select"
              value={settings.themeMode || "dark"}
              onChange={(e) => setSetting("themeMode", e.target.value)}
              disabled={readOnly}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Text alignment</label>
            <select
              className="admin-cms__select"
              value={settings.textAlign || "left"}
              onChange={(e) => setSetting("textAlign", e.target.value)}
              disabled={readOnly}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </details>
    </div>
  );
}
