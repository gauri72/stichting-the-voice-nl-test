import { useMemo } from "react";

function fieldKey(field) {
  return `${field.fieldId}__${field.repeatIndex || 0}__${field.ticketTypeId || ""}`;
}

export function serializeCheckoutAnswers(fields, answerMap) {
  return (fields || []).map((f) => ({
    questionId: f.fieldId,
    repeatIndex: Number(f.repeatIndex || 0),
    ticketTypeId: f.ticketTypeId || null,
    answer: answerMap[fieldKey(f)] ?? null,
  }));
}

export default function DynamicCheckoutForm({ fields = [], values = {}, onChange }) {
  const visible = useMemo(() => (fields || []).filter((f) => f.visibility !== false), [fields]);

  if (!visible.length) return null;

  return (
    <section className="ticket-booking__card">
      <h2>Checkout questions</h2>
      <div className="ticket-booking__form-grid">
        {visible.map((field) => {
          const key = fieldKey(field);
          const labelSuffix = field.repeatMode && field.repeatMode !== "order" ? ` #${Number(field.repeatIndex || 0) + 1}` : "";
          if (field.type === "section_heading") return <h3 key={key}>{field.label}</h3>;
          if (field.type === "description_text") return <p key={key}>{field.helpText || field.label}</p>;
          const common = {
            value: values[key] ?? "",
            onChange: (e) => onChange(key, e.target.value),
            placeholder: field.placeholder || "",
            required: Boolean(field.required),
          };
          return (
            <label key={key}>
              {field.label}{labelSuffix}{field.required ? " *" : ""}
              {field.type === "textarea" ? <textarea {...common} /> : null}
              {["text", "email", "phone", "number", "date", "time", "url"].includes(field.type) ? (
                <input {...common} type={field.type === "phone" ? "tel" : field.type} />
              ) : null}
              {["dropdown", "radio"].includes(field.type) ? (
                <select {...common}>
                  <option value="">Select...</option>
                  {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : null}
              {field.type === "checkbox" || field.type === "consent" ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[key])}
                  onChange={(e) => onChange(key, e.target.checked)}
                />
              ) : null}
              {(field.type === "file" || field.type === "image") ? (
                <input
                  type="file"
                  accept={field.type === "image" ? "image/*" : undefined}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onChange(key, String(reader.result || ""));
                    reader.readAsDataURL(file);
                  }}
                />
              ) : null}
              {field.helpText ? <small>{field.helpText}</small> : null}
            </label>
          );
        })}
      </div>
    </section>
  );
}
