/** Core customer field IDs collected in attendee step — hide on review when populated */
export const CORE_CUSTOMER_FIELD_IDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "full_name",
]);

export const PROTECTED_CORE_FIELD_IDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "terms",
]);

export const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "dropdown",
  "multi_select",
  "radio",
  "checkbox",
  "consent",
  "date",
  "time",
  "file",
  "image",
  "url",
  "section_heading",
  "description_text",
];

export const REPEAT_MODES = [
  "order",
  "ticket_quantity",
  "participant_count",
  "ticket_type",
  "none",
];

export const CONDITION_OPERATORS = ["equals", "not_equals", "contains", "in"];

export function fieldKey(field) {
  return `${field.fieldId}__${field.repeatIndex || 0}__${field.ticketTypeId || ""}`;
}

export function buildKnownAnswersFromAttendee(attendee = {}) {
  const out = {};
  if (attendee.firstName) out.first_name = attendee.firstName;
  if (attendee.lastName) out.last_name = attendee.lastName;
  if (attendee.email) out.email = attendee.email;
  if (attendee.phone) out.phone = attendee.phone;
  const fullName = `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim();
  if (fullName) out.full_name = fullName;
  return out;
}

export function filterFieldsForDisplay(fields = [], { hideCollected = false, knownAnswers = {} } = {}) {
  return (fields || []).filter((f) => {
    if (f.visibility === false) return false;
    if (f.hideOnReview) return false;
    if (hideCollected && CORE_CUSTOMER_FIELD_IDS.has(f.fieldId)) {
      const val = knownAnswers[f.fieldId];
      if (val != null && val !== "") return false;
    }
    return true;
  });
}

export function autoPopulateValues(fields = [], knownAnswers = {}, existing = {}) {
  const next = { ...existing };
  for (const field of fields || []) {
    const key = fieldKey(field);
    if (next[key] != null && next[key] !== "") continue;
    const known = knownAnswers[field.fieldId];
    if (known != null && known !== "") next[key] = known;
  }
  return next;
}

export function emptyField(order = 1) {
  return {
    fieldId: `field_${Date.now()}_${order}`,
    label: "",
    type: "text",
    placeholder: "",
    helpText: "",
    required: false,
    options: [],
    repeatMode: "order",
    order,
    visibility: true,
    showInAdmin: true,
    showInEmail: false,
    showInPdf: false,
    showInCheckIn: false,
    isCore: false,
    isProtected: false,
    conditionalLogic: [],
  };
}

export function formatFormTypeLabel(formType) {
  const map = {
    basic_ticket: "Basic Ticket",
    attendee: "Attendee",
    group_family: "Group / Family",
    membership_aware: "Membership",
    rsvp: "RSVP",
    session: "Session",
    custom: "Custom",
  };
  return map[formType] || formType || "Custom";
}

export function formatScopeLabel(scope) {
  const map = {
    global: "Global",
    standard: "Standard",
    event_type: "Event Type",
    event: "Event",
    ticket_type: "Ticket Type",
  };
  return map[scope] || scope;
}
