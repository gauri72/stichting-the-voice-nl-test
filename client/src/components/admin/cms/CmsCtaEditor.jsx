import { IconPlus, IconTrash } from "@tabler/icons-react";
import AiAssistantButton from "./AiAssistantButton.jsx";
import { CTA_STYLES } from "../../../utils/pagesAdmin.js";

function emptyCta() {
  return {
    id: `cta-${Date.now()}`,
    text: "",
    url: "",
    target: "_self",
    style: "primary",
    visible: true,
    trackingLabel: "",
  };
}

export default function CmsCtaEditor({ ctas = [], onChange, disabled = false }) {
  const items = ctas.length ? ctas : [];

  function update(index, field, value) {
    const next = items.map((cta, i) => (i === index ? { ...cta, [field]: value } : cta));
    onChange(next);
  }

  function add() {
    onChange([...items, emptyCta()]);
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-cms__cta-editor">
      {items.map((cta, index) => (
        <div key={cta.id || index} className="admin-cms__cta-card">
          <div className="admin-cms__cta-card-header">
            <strong>CTA {index + 1}</strong>
            {!disabled ? (
              <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => remove(index)}>
                <IconTrash size={14} />
              </button>
            ) : null}
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">
              Button text
              <AiAssistantButton text={cta.url || cta.text} actions={["generate_cta"]} onApply={(v) => update(index, "text", v)} disabled={disabled} />
            </label>
            <input className="admin-cms__input" value={cta.text || ""} onChange={(e) => update(index, "text", e.target.value)} disabled={disabled} />
          </div>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">URL</label>
            <input className="admin-cms__input" value={cta.url || ""} onChange={(e) => update(index, "url", e.target.value)} disabled={disabled} placeholder="/page or https://..." />
          </div>
          <div className="admin-cms__field-grid">
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Style</label>
              <select className="admin-cms__select" value={cta.style || "primary"} onChange={(e) => update(index, "style", e.target.value)} disabled={disabled}>
                {CTA_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Target</label>
              <select className="admin-cms__select" value={cta.target || "_self"} onChange={(e) => update(index, "target", e.target.value)} disabled={disabled}>
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
          </div>
          <label className="admin-cms__checkbox">
            <input type="checkbox" checked={cta.visible !== false} onChange={(e) => update(index, "visible", e.target.checked)} disabled={disabled} />
            Visible
          </label>
          <div className="admin-cms__field-row">
            <label className="admin-cms__label">Tracking label (optional)</label>
            <input className="admin-cms__input" value={cta.trackingLabel || ""} onChange={(e) => update(index, "trackingLabel", e.target.value)} disabled={disabled} />
          </div>
        </div>
      ))}
      {!disabled ? (
        <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={add}>
          <IconPlus size={16} /> Add CTA
        </button>
      ) : null}
    </div>
  );
}
