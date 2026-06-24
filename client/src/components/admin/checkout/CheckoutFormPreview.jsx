import { fieldKey } from "../../../utils/checkoutFormUtils.js";

export default function CheckoutFormPreview({ fields = [], values = {} }) {
  const visible = (fields || []).filter((f) => f.visibility !== false);

  if (!visible.length) {
    return <p className="admin-events__hint">No fields to preview.</p>;
  }

  return (
    <div className="checkout-form-preview admin-events__form-grid">
      {visible.map((field) => {
        const key = fieldKey(field);
        const labelSuffix = field.repeatMode && field.repeatMode !== "order" ? ` #${Number(field.repeatIndex || 0) + 1}` : "";

        if (field.type === "section_heading") {
          return <h4 key={key} className="checkout-form-preview__heading">{field.label}</h4>;
        }
        if (field.type === "description_text") {
          return <p key={key} className="checkout-form-preview__desc">{field.helpText || field.label}</p>;
        }

        const val = values[key] ?? "";
        return (
          <label key={key} className="checkout-form-preview__field">
            <span>
              {field.label}{labelSuffix}{field.required ? " *" : ""}
            </span>
            {field.type === "textarea" ? (
              <textarea value={val} readOnly placeholder={field.placeholder || ""} rows={3} />
            ) : null}
            {["text", "email", "phone", "number", "date", "time", "url"].includes(field.type) ? (
              <input type={field.type === "phone" ? "tel" : field.type} value={val} readOnly placeholder={field.placeholder || ""} />
            ) : null}
            {["dropdown", "multi_select"].includes(field.type) ? (
              <select value={val} disabled>
                <option value="">Select…</option>
                {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : null}
            {field.type === "radio" ? (
              <div className="checkout-form-preview__radio-group">
                {(field.options || []).map((o) => (
                  <label key={o}>
                    <input type="radio" checked={val === o} readOnly /> {o}
                  </label>
                ))}
              </div>
            ) : null}
            {(field.type === "checkbox" || field.type === "consent") ? (
              <input type="checkbox" checked={Boolean(val)} readOnly />
            ) : null}
            {field.helpText ? <small>{field.helpText}</small> : null}
          </label>
        );
      })}
    </div>
  );
}
