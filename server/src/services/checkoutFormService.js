import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import CheckoutForm from "../models/CheckoutForm.js";
import CheckoutFormResponse from "../models/CheckoutFormResponse.js";
import Event from "../models/Event.js";
import { getNextSequence } from "../utils/sequence.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FILE_MIME = [...ALLOWED_IMAGE_MIME, "application/pdf", "text/plain"];

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

async function nextFormId() {
  const seq = await getNextSequence("checkout_form");
  return `CF-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

async function nextResponseId() {
  const seq = await getNextSequence("checkout_form_response");
  return `CFR-${new Date().getFullYear()}-${String(seq).padStart(7, "0")}`;
}

function formatForm(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    formId: doc.formId,
    name: doc.name,
    scope: doc.scope,
    eventType: doc.eventType || "",
    eventId: doc.eventId?.toString?.() || doc.eventId || null,
    ticketTypeId: doc.ticketTypeId?.toString?.() || doc.ticketTypeId || null,
    fields: (doc.fields || []).map((f) => ({ ...f })),
    status: doc.status || "draft",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function formatResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    responseId: doc.responseId,
    formId: doc.formId,
    eventId: doc.eventId?.toString?.() || doc.eventId,
    orderId: doc.orderId?.toString?.() || doc.orderId || null,
    ticketTypeId: doc.ticketTypeId?.toString?.() || doc.ticketTypeId || null,
    ticketId: doc.ticketId?.toString?.() || doc.ticketId || null,
    userId: doc.userId?.toString?.() || doc.userId || null,
    answers: doc.answers || [],
    createdAt: doc.createdAt,
  };
}

async function ensureScopeUniqueness(payload, ignoreId = null) {
  const query = {
    scope: payload.scope,
    status: { $in: ["draft", "published"] },
  };
  if (payload.scope === "event_type") query.eventType = payload.eventType || "";
  if (payload.scope === "event") query.eventId = payload.eventId || null;
  if (payload.scope === "ticket_type") query.ticketTypeId = payload.ticketTypeId || null;
  if (ignoreId) query._id = { $ne: ignoreId };
  const exists = await CheckoutForm.findOne(query).lean();
  if (exists) throwError("A form already exists for this scope.");
}

function baseDefaultFields() {
  return [
    {
      fieldId: "first_name",
      label: "First Name",
      type: "text",
      placeholder: "Enter first name",
      helpText: "",
      required: true,
      options: [],
      repeatMode: "order",
      visibility: true,
      showInEmail: true,
      showInPdf: true,
      showInAdmin: true,
      showInCheckIn: true,
      conditionalLogic: [],
      order: 1,
    },
    {
      fieldId: "last_name",
      label: "Last Name",
      type: "text",
      placeholder: "Enter last name",
      required: true,
      options: [],
      repeatMode: "order",
      visibility: true,
      showInEmail: true,
      showInPdf: true,
      showInAdmin: true,
      showInCheckIn: true,
      conditionalLogic: [],
      order: 2,
    },
    {
      fieldId: "email",
      label: "Email",
      type: "email",
      placeholder: "name@email.com",
      required: true,
      options: [],
      repeatMode: "order",
      visibility: true,
      showInEmail: true,
      showInPdf: false,
      showInAdmin: true,
      showInCheckIn: false,
      conditionalLogic: [],
      order: 3,
    },
    {
      fieldId: "phone",
      label: "Phone Number",
      type: "phone",
      placeholder: "+31 ...",
      required: false,
      options: [],
      repeatMode: "order",
      visibility: true,
      showInEmail: false,
      showInPdf: false,
      showInAdmin: true,
      showInCheckIn: false,
      conditionalLogic: [],
      order: 4,
    },
    {
      fieldId: "terms",
      label: "I agree to terms & conditions",
      type: "consent",
      required: true,
      options: [],
      repeatMode: "order",
      visibility: true,
      showInEmail: false,
      showInPdf: false,
      showInAdmin: true,
      showInCheckIn: false,
      conditionalLogic: [],
      order: 999,
    },
  ];
}

export async function ensureGlobalCheckoutForm(adminId = null) {
  let form = await CheckoutForm.findOne({ scope: "global", status: { $in: ["draft", "published"] } });
  if (!form) {
    form = await CheckoutForm.create({
      formId: await nextFormId(),
      name: "Global Checkout Form",
      scope: "global",
      fields: baseDefaultFields(),
      status: "published",
      createdBy: adminId || null,
    });
  }
  return formatForm(form.toObject());
}

export async function listCheckoutForms(filters = {}) {
  const query = {};
  if (filters.scope) query.scope = filters.scope;
  if (filters.status) query.status = filters.status;
  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.eventId) query.eventId = filters.eventId;
  if (filters.ticketTypeId) query.ticketTypeId = filters.ticketTypeId;
  const docs = await CheckoutForm.find(query).sort({ scope: 1, createdAt: -1 }).lean();
  return docs.map(formatForm);
}

export async function getCheckoutFormById(id) {
  const doc = await CheckoutForm.findById(id).lean();
  if (!doc) throwError("Checkout form not found.", 404);
  return formatForm(doc);
}

function normalizeFieldInput(fields = []) {
  return (fields || [])
    .map((f, i) => ({
      fieldId: normalizeString(f.fieldId) || `field_${i + 1}`,
      label: normalizeString(f.label) || `Field ${i + 1}`,
      type: normalizeString(f.type) || "text",
      placeholder: normalizeString(f.placeholder),
      helpText: normalizeString(f.helpText),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options.map((o) => normalizeString(o)).filter(Boolean) : [],
      repeatMode: normalizeString(f.repeatMode) || "order",
      visibility: f.visibility !== false,
      showInEmail: Boolean(f.showInEmail),
      showInPdf: Boolean(f.showInPdf),
      showInAdmin: f.showInAdmin !== false,
      showInCheckIn: Boolean(f.showInCheckIn),
      conditionalLogic: Array.isArray(f.conditionalLogic) ? f.conditionalLogic : [],
      order: Number(f.order ?? i + 1),
    }))
    .sort((a, b) => a.order - b.order);
}

export async function createCheckoutForm(payload, adminId) {
  if (!payload?.name) throwError("Form name is required.");
  if (!payload?.scope) throwError("Form scope is required.");
  if (!["global", "event_type", "event", "ticket_type"].includes(payload.scope)) {
    throwError("Invalid form scope.");
  }
  if (payload.scope === "event_type" && !payload.eventType) throwError("eventType is required for event_type scope.");
  if (payload.scope === "event" && !payload.eventId) throwError("eventId is required for event scope.");
  if (payload.scope === "ticket_type" && !payload.ticketTypeId) throwError("ticketTypeId is required for ticket_type scope.");
  await ensureScopeUniqueness(payload);
  const doc = await CheckoutForm.create({
    formId: await nextFormId(),
    name: payload.name,
    scope: payload.scope,
    eventType: payload.eventType || "",
    eventId: payload.eventId || null,
    ticketTypeId: payload.ticketTypeId || null,
    fields: normalizeFieldInput(payload.fields || []),
    status: payload.status || "draft",
    createdBy: adminId || null,
  });
  return formatForm(doc.toObject());
}

export async function updateCheckoutForm(id, payload) {
  const doc = await CheckoutForm.findById(id);
  if (!doc) throwError("Checkout form not found.", 404);
  const next = {
    scope: payload.scope ?? doc.scope,
    eventType: payload.eventType ?? doc.eventType,
    eventId: payload.eventId ?? doc.eventId,
    ticketTypeId: payload.ticketTypeId ?? doc.ticketTypeId,
  };
  await ensureScopeUniqueness(next, doc._id);
  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.scope !== undefined) doc.scope = payload.scope;
  if (payload.eventType !== undefined) doc.eventType = payload.eventType || "";
  if (payload.eventId !== undefined) doc.eventId = payload.eventId || null;
  if (payload.ticketTypeId !== undefined) doc.ticketTypeId = payload.ticketTypeId || null;
  if (payload.fields !== undefined) doc.fields = normalizeFieldInput(payload.fields);
  if (payload.status !== undefined) doc.status = payload.status;
  await doc.save();
  return formatForm(doc.toObject());
}

export async function deleteCheckoutForm(id) {
  const result = await CheckoutForm.deleteOne({ _id: id });
  if (!result.deletedCount) throwError("Checkout form not found.", 404);
  return { deleted: true };
}

async function getEventTypeFromContext(eventId, explicitEventType = "") {
  if (explicitEventType) return explicitEventType;
  if (!eventId) return "";
  const event = await Event.findById(eventId).lean();
  if (!event) return "";
  return event.category || "ticketed_event";
}

function evaluateCondition(rule, answerMap) {
  const source = answerMap.get(rule.sourceFieldId);
  const op = rule.operator || "equals";
  const compare = rule.value;
  if (op === "equals") return String(source ?? "") === String(compare ?? "");
  if (op === "not_equals") return String(source ?? "") !== String(compare ?? "");
  if (op === "contains") return String(source ?? "").includes(String(compare ?? ""));
  if (op === "in") return Array.isArray(compare) ? compare.map(String).includes(String(source ?? "")) : false;
  return true;
}

function isFieldVisibleByCondition(field, answerMap) {
  if (!field.visibility) return false;
  const rules = Array.isArray(field.conditionalLogic) ? field.conditionalLogic : [];
  if (!rules.length) return true;
  return rules.every((r) => evaluateCondition(r, answerMap));
}

function buildRepeatInstances(field, context) {
  const repeat = field.repeatMode || "order";
  if (["none", "order"].includes(repeat)) return [{ repeatIndex: 0, ticketTypeId: null }];
  if (repeat === "ticket_type") {
    return (context.items || []).map((it, idx) => ({ repeatIndex: idx, ticketTypeId: it.ticketTypeId || null }));
  }
  if (repeat === "ticket_quantity") {
    const out = [];
    for (const it of context.items || []) {
      const qty = Number(it.quantity || 0);
      for (let i = 0; i < qty; i += 1) out.push({ repeatIndex: out.length, ticketTypeId: it.ticketTypeId || null });
    }
    return out;
  }
  if (repeat === "participant_count") {
    const count = Number(context.participantCount || context.ticketQuantity || 0);
    return Array.from({ length: Math.max(0, count) }, (_, i) => ({ repeatIndex: i, ticketTypeId: null }));
  }
  return [{ repeatIndex: 0, ticketTypeId: null }];
}

function mergeFields(forms = []) {
  const all = [];
  for (const form of forms) {
    for (const field of form.fields || []) {
      all.push({
        ...field,
        sourceScope: form.scope,
        sourceFormId: form.formId,
      });
    }
  }
  return all.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export async function resolveCheckoutForms(payload = {}) {
  const eventId = payload.eventId || null;
  const eventType = await getEventTypeFromContext(eventId, payload.eventType || "");
  const ticketTypeIds = (payload.ticketTypeIds || []).map((t) => String(t));

  const [global, eventTypeForm, eventForm, ticketForms] = await Promise.all([
    CheckoutForm.findOne({ scope: "global", status: "published" }).lean(),
    eventType
      ? CheckoutForm.findOne({ scope: "event_type", eventType, status: "published" }).lean()
      : null,
    eventId
      ? CheckoutForm.findOne({ scope: "event", eventId, status: "published" }).lean()
      : null,
    ticketTypeIds.length
      ? CheckoutForm.find({
          scope: "ticket_type",
          ticketTypeId: { $in: ticketTypeIds },
          status: "published",
        }).lean()
      : [],
  ]);

  const layers = [global, eventTypeForm, eventForm, ...(ticketForms || [])].filter(Boolean);
  if (!layers.length) {
    const seeded = await ensureGlobalCheckoutForm();
    layers.push(seeded);
  }

  const forms = layers.map((f) => formatForm(f));
  const mergedFields = mergeFields(forms);
  const context = {
    items: payload.items || [],
    ticketQuantity: Number(payload.ticketQuantity || 0),
    participantCount: Number(payload.participantCount || payload.ticketQuantity || 0),
  };
  const renderedFields = [];
  const answerMap = new Map();
  for (const field of mergedFields) {
    if (!isFieldVisibleByCondition(field, answerMap)) continue;
    const instances = buildRepeatInstances(field, context);
    for (const inst of instances) {
      renderedFields.push({
        ...field,
        repeatIndex: inst.repeatIndex,
        ticketTypeId: inst.ticketTypeId,
      });
    }
  }

  return {
    forms,
    resolvedPriority: ["ticket_type", "event", "event_type", "global"],
    fields: renderedFields,
  };
}

function validateSingleValue(field, value) {
  const type = field.type;
  if (value == null || value === "") return;
  const text = String(value);
  if (type === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    if (!ok) throwError(`Invalid email format for "${field.label}".`);
  }
  if (type === "phone") {
    const ok = /^[+\d()\-\s]{6,25}$/.test(text);
    if (!ok) throwError(`Invalid phone format for "${field.label}".`);
  }
  if (type === "number") {
    if (Number.isNaN(Number(value))) throwError(`"${field.label}" must be a number.`);
  }
  if (type === "url") {
    try {
      // eslint-disable-next-line no-new
      new URL(text);
    } catch {
      throwError(`"${field.label}" must be a valid URL.`);
    }
  }
}

async function saveDataUrlFile(fieldId, dataUrl, uploadDir) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throwError(`Invalid upload data for ${fieldId}.`);
  const mime = match[1];
  const base64 = match[2];
  const size = Math.ceil((base64.length * 3) / 4);
  const allowed = fieldId.includes("image") ? ALLOWED_IMAGE_MIME : ALLOWED_FILE_MIME;
  if (!allowed.includes(mime)) throwError(`Unsupported file type for ${fieldId}.`);
  if (size > MAX_FILE_SIZE) throwError(`File too large for ${fieldId}. Max 5MB.`);
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = mime.split("/")[1] || "bin";
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const abs = path.join(uploadDir, name);
  await fs.writeFile(abs, Buffer.from(base64, "base64"));
  return `/uploads/checkout-forms/${name}`;
}

export async function validateCheckoutFormAnswers(payload = {}) {
  const resolved = await resolveCheckoutForms(payload);
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const answerKey = (fieldId, repeatIndex, ticketTypeId) =>
    `${fieldId}__${repeatIndex}__${ticketTypeId || ""}`;
  const map = new Map(
    answers.map((a) => [
      answerKey(a.questionId || a.fieldId, Number(a.repeatIndex || 0), a.ticketTypeId ? String(a.ticketTypeId) : ""),
      a,
    ])
  );
  const validatedAnswers = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads", "checkout-forms");

  for (const field of resolved.fields) {
    const key = answerKey(field.fieldId, Number(field.repeatIndex || 0), field.ticketTypeId ? String(field.ticketTypeId) : "");
    const provided = map.get(key);
    let value = provided?.answer;
    if (field.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length))) {
      throwError(`"${field.label}" is required.`);
    }
    if ((field.type === "file" || field.type === "image") && typeof value === "string" && value.startsWith("data:")) {
      value = await saveDataUrlFile(field.type, value, uploadDir);
    }
    validateSingleValue(field, value);
    validatedAnswers.push({
      questionId: field.fieldId,
      questionLabel: field.label,
      answer: value ?? null,
      repeatIndex: Number(field.repeatIndex || 0),
      ticketTypeId: field.ticketTypeId || null,
      visibility: {
        showInEmail: Boolean(field.showInEmail),
        showInPdf: Boolean(field.showInPdf),
        showInAdmin: field.showInAdmin !== false,
        showInCheckIn: Boolean(field.showInCheckIn),
      },
    });
  }

  return { resolved, answers: validatedAnswers };
}

export async function saveCheckoutFormResponse(payload = {}) {
  const validated = await validateCheckoutFormAnswers(payload);
  const responseDoc = await CheckoutFormResponse.create({
    responseId: await nextResponseId(),
    formId: validated.resolved.forms[0]?.formId || "MIXED",
    eventId: payload.eventId,
    orderId: payload.orderId || null,
    ticketTypeId: payload.ticketTypeId || null,
    ticketId: payload.ticketId || null,
    userId: payload.userId || null,
    answers: validated.answers,
  });
  return {
    response: formatResponse(responseDoc.toObject()),
    resolved: validated.resolved,
  };
}

export async function listCheckoutFormResponses(filters = {}) {
  const query = {};
  if (filters.eventId) query.eventId = filters.eventId;
  if (filters.ticketTypeId) query.ticketTypeId = filters.ticketTypeId;
  if (filters.orderId) query.orderId = filters.orderId;
  const docs = await CheckoutFormResponse.find(query).sort({ createdAt: -1 }).lean();
  const formatted = docs.map(formatResponse);
  const q = normalizeString(filters.search).toLowerCase();
  if (!q) return formatted;
  return formatted.filter((r) =>
    r.answers.some((a) =>
      `${a.questionLabel} ${Array.isArray(a.answer) ? a.answer.join(", ") : a.answer ?? ""}`
        .toLowerCase()
        .includes(q)
    )
  );
}

export function buildAnswerVisibilitySlices(answers = []) {
  const by = (predicate) =>
    (answers || []).filter((a) => predicate(a.visibility || {})).map((a) => ({
      questionLabel: a.questionLabel,
      answer: a.answer,
      repeatIndex: a.repeatIndex,
      ticketTypeId: a.ticketTypeId || null,
    }));
  return {
    email: by((v) => v.showInEmail),
    pdf: by((v) => v.showInPdf),
    admin: by((v) => v.showInAdmin !== false),
    checkIn: by((v) => v.showInCheckIn),
  };
}
