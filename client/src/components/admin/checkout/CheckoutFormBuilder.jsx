import { useState } from "react";
import {
  FIELD_TYPES,
  REPEAT_MODES,
  CONDITION_OPERATORS,
  PROTECTED_CORE_FIELD_IDS,
  emptyField,
} from "../../../utils/checkoutFormUtils.js";
import CheckoutFormPreview from "./CheckoutFormPreview.jsx";

function FieldEditor({ field, index, total, onChange, onRemove, onDuplicate, onMove }) {
  const isProtected = field.isProtected || PROTECTED_CORE_FIELD_IDS.has(field.fieldId);
  const [showLogic, setShowLogic] = useState(Boolean(field.conditionalLogic?.length));
  const optionsText = (field.options || []).join("\n");

  function update(key, value) {
    onChange(index, { ...field, [key]: value });
  }

  function updateLogic(ruleIdx, key, value) {
    const logic = [...(field.conditionalLogic || [])];
    logic[ruleIdx] = { ...logic[ruleIdx], [key]: value };
    update("conditionalLogic", logic);
  }

  function addLogicRule() {
    update("conditionalLogic", [
      ...(field.conditionalLogic || []),
      { sourceFieldId: "", operator: "equals", value: "" },
    ]);
    setShowLogic(true);
  }

  return (
    <div className="checkout-builder__field-card admin-events__card">
      <div className="checkout-builder__field-header">
        <strong>{field.label || `Field ${index + 1}`}</strong>
        <div className="checkout-builder__field-actions">
          <button type="button" className="admin-events__secondary-btn" disabled={index === 0} onClick={() => onMove(index, -1)}>↑</button>
          <button type="button" className="admin-events__secondary-btn" disabled={index >= total - 1} onClick={() => onMove(index, 1)}>↓</button>
          <button type="button" className="admin-events__secondary-btn" onClick={() => onDuplicate(index)}>Duplicate</button>
          {!isProtected ? (
            <button type="button" className="admin-events__danger-btn" onClick={() => onRemove(index)}>Delete</button>
          ) : (
            <span className="admin-events__hint">Protected</span>
          )}
        </div>
      </div>

      <div className="admin-events__form-grid">
        <label>
          Label
          <input value={field.label} onChange={(e) => update("label", e.target.value)} required />
        </label>
        <label>
          Field ID
          <input value={field.fieldId} onChange={(e) => update("fieldId", e.target.value)} disabled={isProtected} />
        </label>
        <label>
          Type
          <select value={field.type} onChange={(e) => update("type", e.target.value)} disabled={isProtected && PROTECTED_CORE_FIELD_IDS.has(field.fieldId)}>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Placeholder
          <input value={field.placeholder || ""} onChange={(e) => update("placeholder", e.target.value)} />
        </label>
        <label>
          Help text
          <input value={field.helpText || ""} onChange={(e) => update("helpText", e.target.value)} />
        </label>
        <label>
          Repeat mode
          <select value={field.repeatMode || "order"} onChange={(e) => update("repeatMode", e.target.value)}>
            {REPEAT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="admin-events__toggle">
          <input type="checkbox" checked={Boolean(field.required)} onChange={(e) => update("required", e.target.checked)} />
          <span>Required</span>
        </label>
        {["dropdown", "multi_select", "radio"].includes(field.type) ? (
          <label className="checkout-builder__options">
            Options (one per line)
            <textarea
              rows={4}
              value={optionsText}
              onChange={(e) => update("options", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
            />
          </label>
        ) : null}
      </div>

      <div className="checkout-builder__visibility">
        {[
          ["showInEmail", "Email", false],
          ["showInPdf", "PDF", false],
          ["showInAdmin", "Admin", true],
          ["showInCheckIn", "Check-in", false],
        ].map(([key, label, defaultVal]) => (
          <label key={key} className="admin-events__toggle">
            <input
              type="checkbox"
              checked={field[key] !== undefined ? Boolean(field[key]) : defaultVal}
              onChange={(e) => update(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="checkout-builder__logic">
        <button type="button" className="admin-events__outline-btn" onClick={() => setShowLogic((v) => !v)}>
          {showLogic ? "Hide" : "Add"} conditional logic
        </button>
        {showLogic ? (
          <div className="checkout-builder__logic-rules">
            {(field.conditionalLogic || []).map((rule, ri) => (
              <div key={ri} className="checkout-builder__logic-rule">
                <input
                  placeholder="Source field ID"
                  value={rule.sourceFieldId || ""}
                  onChange={(e) => updateLogic(ri, "sourceFieldId", e.target.value)}
                />
                <select value={rule.operator || "equals"} onChange={(e) => updateLogic(ri, "operator", e.target.value)}>
                  {CONDITION_OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                <input
                  placeholder="Value"
                  value={rule.value ?? ""}
                  onChange={(e) => updateLogic(ri, "value", e.target.value)}
                />
              </div>
            ))}
            <button type="button" className="admin-events__secondary-btn" onClick={addLogicRule}>Add rule</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CheckoutFormBuilder({ form, onSave, onPublish, saving = false }) {
  const [draft, setDraft] = useState(form);
  const [tab, setTab] = useState("fields");
  const [status, setStatus] = useState("");

  function updateField(idx, nextField) {
    setDraft((prev) => {
      const fields = [...prev.fields];
      fields[idx] = nextField;
      return { ...prev, fields };
    });
  }

  function addField() {
    setDraft((prev) => ({
      ...prev,
      fields: [...prev.fields, emptyField(prev.fields.length + 1)],
    }));
  }

  function removeField(idx) {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i + 1 })),
    }));
  }

  function duplicateField(idx) {
    setDraft((prev) => {
      const copy = { ...prev.fields[idx], fieldId: `${prev.fields[idx].fieldId}_copy_${Date.now()}`, isProtected: false, isCore: false };
      const fields = [...prev.fields];
      fields.splice(idx + 1, 0, copy);
      return { ...prev, fields: fields.map((f, i) => ({ ...f, order: i + 1 })) };
    });
  }

  function moveField(idx, dir) {
    setDraft((prev) => {
      const fields = [...prev.fields];
      const target = idx + dir;
      if (target < 0 || target >= fields.length) return prev;
      [fields[idx], fields[target]] = [fields[target], fields[idx]];
      return { ...prev, fields: fields.map((f, i) => ({ ...f, order: i + 1 })) };
    });
  }

  async function handleSave(publish = false) {
    setStatus("");
    try {
      if (publish && onPublish) await onPublish(draft);
      else await onSave(draft);
      setStatus(publish ? "Form published." : "Changes saved.");
    } catch (err) {
      setStatus(err.message || "Save failed.");
    }
  }

  return (
    <div className="checkout-builder">
      <div className="admin-events__list-tabs" role="tablist">
        <button type="button" role="tab" className={`admin-events__list-tab${tab === "fields" ? " admin-events__list-tab--active" : ""}`} onClick={() => setTab("fields")}>Fields</button>
        <button type="button" role="tab" className={`admin-events__list-tab${tab === "preview" ? " admin-events__list-tab--active" : ""}`} onClick={() => setTab("preview")}>Preview</button>
      </div>

      {tab === "fields" ? (
        <>
          <div className="checkout-builder__toolbar">
            <button type="button" className="admin-events__secondary-btn" onClick={addField}>Add field</button>
            <button type="button" className="admin-events__primary-btn" disabled={saving} onClick={() => handleSave(false)}>Save changes</button>
            <button type="button" className="admin-events__outline-btn" disabled={saving} onClick={() => handleSave(true)}>Save &amp; publish</button>
          </div>
          {draft.fields.map((field, idx) => (
            <FieldEditor
              key={field.fieldId}
              field={field}
              index={idx}
              total={draft.fields.length}
              onChange={updateField}
              onRemove={removeField}
              onDuplicate={duplicateField}
              onMove={moveField}
            />
          ))}
        </>
      ) : (
        <CheckoutFormPreview fields={draft.fields} />
      )}

      {status ? <p className="admin-events__hint" role="status">{status}</p> : null}
    </div>
  );
}
