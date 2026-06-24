/**
 * Normalizes checkout field definitions for storage and rendering.
 */
export function normalizeCheckoutField(field, index = 0, options = {}) {
  const { isStandard = false } = options;
  const fieldId = String(field.fieldId ?? field.id ?? `field_${index + 1}`).trim();
  const isCore = Boolean(field.isCore) || ["first_name", "last_name", "email", "phone", "terms", "full_name"].includes(fieldId);
  return {
    fieldId,
    label: String(field.label || `Field ${index + 1}`).trim().slice(0, 200),
    isCore,
    isProtected: Boolean(field.isProtected) || (isStandard && isCore),
    type: String(field.type || "text").trim(),
    placeholder: String(field.placeholder || "").trim().slice(0, 200),
    helpText: String(field.helpText || "").trim().slice(0, 500),
    required: Boolean(field.required),
    options: Array.isArray(field.options) ? field.options.map((o) => String(o).trim()).filter(Boolean) : [],
    repeatMode: String(field.repeatMode || "order"),
    visibility: field.visibility !== false,
    showInEmail: Boolean(field.showInEmail),
    showInPdf: Boolean(field.showInPdf),
    showInAdmin: field.showInAdmin !== false,
    showInCheckIn: Boolean(field.showInCheckIn),
    conditionalLogic: Array.isArray(field.conditionalLogic) ? field.conditionalLogic : [],
    order: Number(field.order ?? index + 1),
  };
}

export function normalizeCheckoutFields(fields = [], options = {}) {
  return (fields || [])
    .map((f, i) => normalizeCheckoutField(f, i, options))
    .sort((a, b) => a.order - b.order);
}

export function deduplicateCheckoutFields(fields = []) {
  const seen = new Set();
  const coreIds = new Set(["first_name", "last_name", "email", "phone", "full_name", "terms"]);
  const out = [];
  for (const field of fields) {
    const key = coreIds.has(field.fieldId)
      ? field.fieldId
      : `${field.fieldId}__${field.repeatIndex || 0}__${field.ticketTypeId || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(field);
  }
  return out;
}
