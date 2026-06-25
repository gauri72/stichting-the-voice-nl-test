import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fieldKey, filterFieldsForDisplay } from "../../utils/checkoutFormUtils.js";

export function serializeCheckoutAnswers(fields, answerMap) {
  return (fields || []).map((f) => ({
    questionId: f.fieldId,
    repeatIndex: Number(f.repeatIndex || 0),
    ticketTypeId: f.ticketTypeId || null,
    answer: answerMap[fieldKey(f)] ?? null,
  }));
}

export default function DynamicCheckoutForm({
  fields = [],
  values = {},
  onChange,
  hideCollected = false,
  knownAnswers = {},
}) {
  const { t } = useTranslation(["checkout"]);
  const visible = useMemo(
    () => filterFieldsForDisplay(fields, { hideCollected, knownAnswers }),
    [fields, hideCollected, knownAnswers]
  );

  if (!visible.length) return null;

  return (
    <section className="ticket-booking__card">
      <h2>{t("checkout:dynamicForm.title")}</h2>
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
              {field.type === "dropdown" ? (
                <select {...common}>
                  <option value="">{t("checkout:dynamicForm.selectPlaceholder")}</option>
                  {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : null}
              {field.type === "multi_select" ? (
                <select
                  multiple
                  value={Array.isArray(values[key]) ? values[key] : []}
                  onChange={(e) => onChange(key, Array.from(e.target.selectedOptions, (o) => o.value))}
                  required={Boolean(field.required)}
                >
                  {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : null}
              {field.type === "radio" ? (
                <div className="ticket-booking__radio-group">
                  {(field.options || []).map((o) => (
                    <label key={o} className="ticket-booking__radio-option">
                      <input
                        type="radio"
                        name={key}
                        value={o}
                        checked={values[key] === o}
                        onChange={() => onChange(key, o)}
                        required={Boolean(field.required)}
                      />
                      {o}
                    </label>
                  ))}
                </div>
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
