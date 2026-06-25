import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import CheckoutForm from "../models/CheckoutForm.js";
import CheckoutFormVersion from "../models/CheckoutFormVersion.js";
import CheckoutFormResponse from "../models/CheckoutFormResponse.js";
import Event from "../models/Event.js";
import { STANDARD_CHECKOUT_FORMS, PROTECTED_CORE_FIELD_IDS } from "../config/standardCheckoutForms.js";
import { getNextSequence } from "../utils/sequence.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FILE_MIME = [...ALLOWED_IMAGE_MIME, "application/pdf", "text/plain"];

const CORE_CUSTOMER_FIELD_IDS = new Set(["first_name", "last_name", "email", "phone", "full_name"]);

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function sanitizeText(value, max = 500) {
  return normalizeString(value).slice(0, max);
}

async function nextFormId() {
  const seq = await getNextSequence("checkout_form");
  return `CF-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

async function nextResponseId() {
  const seq = await getNextSequence("checkout_form_response");
  return `CFR-${new Date().getFullYear()}-${String(seq).padStart(7, "0")}`;
}

async function countAssignedEvents(formMongoId) {
  if (!formMongoId) return 0;
  return Event.countDocuments({ assignedCheckoutFormId: formMongoId });
}

export async function formatForm(doc, { includeAssignedCount = true } = {}) {
  if (!doc) return null;
  const id = doc._id?.toString() || doc.id;
  const assignedEventsCount = includeAssignedCount ? await countAssignedEvents(doc._id) : doc.assignedEventsCount ?? 0;
  return {
    id,
    formId: doc.formId,
    name: doc.name,
    description: doc.description || "",
    formType: doc.formType || "custom",
    scope: doc.scope,
    eventType: doc.eventType || "",
    eventId: doc.eventId?.toString?.() || doc.eventId || null,
    ticketTypeId: doc.ticketTypeId?.toString?.() || doc.ticketTypeId || null,
    fields: (doc.fields || []).map((f) => ({ ...f })),
    status: doc.status || "draft",
    version: doc.version || 1,
    isStandard: Boolean(doc.isStandard),
    isSystemDefault: Boolean(doc.isSystemDefault),
    assignedEventsCount,
    publishedAt: doc.publishedAt || null,
    createdBy: doc.createdBy?.toString?.() || doc.createdBy || null,
    updatedBy: doc.updatedBy?.toString?.() || doc.updatedBy || null,
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
    formVersion: doc.formVersion || 1,
    eventId: doc.eventId?.toString?.() || doc.eventId,
    orderId: doc.orderId?.toString?.() || doc.orderId || null,
    ticketTypeId: doc.ticketTypeId?.toString?.() || doc.ticketTypeId || null,
    ticketId: doc.ticketId?.toString?.() || doc.ticketId || null,
    userId: doc.userId?.toString?.() || doc.userId || null,
    answers: doc.answers || [],
    createdAt: doc.createdAt,
  };
}

async function saveFormVersion(doc, adminId = null) {
  await CheckoutFormVersion.create({
    formId: doc.formId,
    checkoutFormRef: doc._id,
    version: doc.version,
    name: doc.name,
    description: doc.description || "",
    formType: doc.formType || "custom",
    scope: doc.scope,
    fields: doc.fields || [],
    status: doc.status,
    publishedAt: doc.publishedAt || null,
    updatedBy: adminId || null,
  });
}

async function ensureScopeUniqueness(payload, ignoreId = null) {
  if (payload.scope === "standard") return;
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
  return STANDARD_CHECKOUT_FORMS[0].fields.map((f) => ({ ...f }));
}

export async function ensureGlobalCheckoutForm(adminId = null) {
  let form = await CheckoutForm.findOne({ scope: "global", status: { $in: ["draft", "published"] } });
  if (!form) {
    const fields = baseDefaultFields();
    form = await CheckoutForm.create({
      formId: await nextFormId(),
      name: "Global Checkout Form",
      description: "Default global checkout form used when no event-specific form is assigned.",
      formType: "basic_ticket",
      scope: "global",
      fields,
      defaultFieldsSnapshot: fields.map((f) => ({ ...f })),
      status: "published",
      version: 1,
      publishedAt: new Date(),
      createdBy: adminId || null,
      updatedBy: adminId || null,
    });
    await saveFormVersion(form, adminId);
  }
  return formatForm(form.toObject());
}

export async function ensureStandardCheckoutForms(adminId = null) {
  await ensureGlobalCheckoutForm(adminId);
  const created = [];
  for (const def of STANDARD_CHECKOUT_FORMS) {
    const exists = await CheckoutForm.findOne({ scope: "standard", formType: def.formType }).lean();
    if (exists) continue;
    const fields = def.fields.map((f) => ({ ...f }));
    const doc = await CheckoutForm.create({
      formId: await nextFormId(),
      name: def.name,
      description: def.description,
      formType: def.formType,
      scope: "standard",
      fields,
      defaultFieldsSnapshot: fields.map((f) => ({ ...f })),
      status: "published",
      version: 1,
      isStandard: true,
      isSystemDefault: true,
      publishedAt: new Date(),
      createdBy: adminId || null,
      updatedBy: adminId || null,
    });
    await saveFormVersion(doc, adminId);
    created.push(await formatForm(doc.toObject()));
  }
  return created;
}

export async function listStandardCheckoutForms() {
  await ensureStandardCheckoutForms();
  const docs = await CheckoutForm.find({ scope: "standard" }).sort({ formType: 1 }).lean();
  return Promise.all(docs.map((d) => formatForm(d)));
}

export async function listCheckoutForms(filters = {}) {
  if (filters.isStandard === "true" || filters.scope === "standard") {
    return listStandardCheckoutForms();
  }
  const query = {};
  if (filters.scope) query.scope = filters.scope;
  if (filters.status) query.status = filters.status;
  if (filters.formType) query.formType = filters.formType;
  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.eventId) query.eventId = filters.eventId;
  if (filters.ticketTypeId) query.ticketTypeId = filters.ticketTypeId;
  if (filters.isStandard !== undefined) query.isStandard = filters.isStandard === "true";
  const docs = await CheckoutForm.find(query).sort({ scope: 1, updatedAt: -1 }).lean();
  return Promise.all(docs.map((d) => formatForm(d)));
}

export async function getCheckoutFormById(id) {
  const doc = await CheckoutForm.findById(id).lean();
  if (!doc) throwError("Checkout form not found.", 404);
  return formatForm(doc);
}

function normalizeFieldInput(fields = [], { isStandard = false } = {}) {
  return (fields || [])
    .map((f, i) => ({
      fieldId: normalizeString(f.fieldId) || `field_${i + 1}`,
      label: sanitizeText(f.label, 200) || `Field ${i + 1}`,
      isCore: Boolean(f.isCore) || PROTECTED_CORE_FIELD_IDS.has(normalizeString(f.fieldId)),
      isProtected: Boolean(f.isProtected) || (isStandard && PROTECTED_CORE_FIELD_IDS.has(normalizeString(f.fieldId))),
      type: normalizeString(f.type) || "text",
      placeholder: sanitizeText(f.placeholder, 200),
      helpText: sanitizeText(f.helpText, 500),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options.map((o) => sanitizeText(o, 120)).filter(Boolean) : [],
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

function validateFieldDeletion(existingFields, newFields, isStandard) {
  if (!isStandard) return;
  const newIds = new Set(newFields.map((f) => f.fieldId));
  for (const field of existingFields) {
    if (field.isProtected && !newIds.has(field.fieldId)) {
      throwError(`Protected field "${field.label}" cannot be deleted.`);
    }
  }
}

export async function createCheckoutForm(payload, adminId) {
  if (!payload?.name) throwError("Form name is required.");
  if (!payload?.scope) throwError("Form scope is required.");
  if (!["global", "standard", "event_type", "event", "ticket_type"].includes(payload.scope)) {
    throwError("Invalid form scope.");
  }
  if (payload.scope === "event_type" && !payload.eventType) throwError("eventType is required for event_type scope.");
  if (payload.scope === "event" && !payload.eventId) throwError("eventId is required for event scope.");
  if (payload.scope === "ticket_type" && !payload.ticketTypeId) throwError("ticketTypeId is required for ticket_type scope.");
  await ensureScopeUniqueness(payload);
  const fields = normalizeFieldInput(payload.fields || [], { isStandard: payload.scope === "standard" });
  const doc = await CheckoutForm.create({
    formId: await nextFormId(),
    name: payload.name,
    description: sanitizeText(payload.description, 500),
    formType: payload.formType || "custom",
    scope: payload.scope,
    eventType: payload.eventType || "",
    eventId: payload.eventId || null,
    ticketTypeId: payload.ticketTypeId || null,
    fields,
    defaultFieldsSnapshot: fields.map((f) => ({ ...f })),
    status: payload.status || "draft",
    version: 1,
    isStandard: payload.scope === "standard" || Boolean(payload.isStandard),
    createdBy: adminId || null,
    updatedBy: adminId || null,
  });
  if (doc.status === "published") {
    doc.publishedAt = new Date();
    await doc.save();
    await saveFormVersion(doc, adminId);
  }
  return formatForm(doc.toObject());
}

export async function updateCheckoutForm(id, payload, adminId = null) {
  const doc = await CheckoutForm.findById(id);
  if (!doc) throwError("Checkout form not found.", 404);
  if (doc.status === "archived" && payload.status !== "archived") {
    throwError("Archived forms cannot be edited. Restore or duplicate first.");
  }
  const next = {
    scope: payload.scope ?? doc.scope,
    eventType: payload.eventType ?? doc.eventType,
    eventId: payload.eventId ?? doc.eventId,
    ticketTypeId: payload.ticketTypeId ?? doc.ticketTypeId,
  };
  await ensureScopeUniqueness(next, doc._id);
  if (payload.name !== undefined) doc.name = sanitizeText(payload.name, 160);
  if (payload.description !== undefined) doc.description = sanitizeText(payload.description, 500);
  if (payload.scope !== undefined) doc.scope = payload.scope;
  if (payload.eventType !== undefined) doc.eventType = payload.eventType || "";
  if (payload.eventId !== undefined) doc.eventId = payload.eventId || null;
  if (payload.ticketTypeId !== undefined) doc.ticketTypeId = payload.ticketTypeId || null;
  if (payload.fields !== undefined) {
    const normalized = normalizeFieldInput(payload.fields, { isStandard: doc.isStandard });
    validateFieldDeletion(doc.fields || [], normalized, doc.isStandard);
    doc.fields = normalized;
    doc.version = (doc.version || 1) + 1;
    await saveFormVersion(doc, adminId);
  }
  if (payload.status !== undefined) doc.status = payload.status;
  if (adminId) doc.updatedBy = adminId;
  await doc.save();
  return formatForm(doc.toObject());
}

export async function publishCheckoutForm(id, adminId = null) {
  const doc = await CheckoutForm.findById(id);
  if (!doc) throwError("Checkout form not found.", 404);
  if (doc.status === "archived") throwError("Cannot publish an archived form.");
  doc.status = "published";
  doc.publishedAt = new Date();
  doc.version = (doc.version || 1) + 1;
  if (adminId) doc.updatedBy = adminId;
  await doc.save();
  await saveFormVersion(doc, adminId);
  return formatForm(doc.toObject());
}

export async function duplicateCheckoutForm(id, adminId = null) {
  const source = await CheckoutForm.findById(id).lean();
  if (!source) throwError("Checkout form not found.", 404);
  const fields = (source.fields || []).map((f) => ({ ...f, isProtected: false }));
  const doc = await CheckoutForm.create({
    formId: await nextFormId(),
    name: `${source.name} (Copy)`,
    description: source.description || "",
    formType: source.formType || "custom",
    scope: source.scope === "standard" ? "standard" : "event",
    eventType: source.eventType || "",
    eventId: null,
    ticketTypeId: null,
    fields,
    defaultFieldsSnapshot: fields.map((f) => ({ ...f })),
    status: "draft",
    version: 1,
    isStandard: source.scope === "standard",
    isSystemDefault: false,
    createdBy: adminId || null,
    updatedBy: adminId || null,
  });
  return formatForm(doc.toObject());
}

export async function restoreDefaultCheckoutForm(id, adminId = null) {
  const doc = await CheckoutForm.findById(id);
  if (!doc) throwError("Checkout form not found.", 404);
  if (!doc.isStandard && !doc.isSystemDefault) throwError("Only standard/system forms can be restored to default.");
  const def = STANDARD_CHECKOUT_FORMS.find((d) => d.formType === doc.formType);
  const snapshot = (doc.defaultFieldsSnapshot?.length ? doc.defaultFieldsSnapshot : def?.fields) || baseDefaultFields();
  doc.fields = snapshot.map((f) => ({ ...f }));
  doc.version = (doc.version || 1) + 1;
  doc.status = "published";
  doc.publishedAt = new Date();
  if (adminId) doc.updatedBy = adminId;
  await doc.save();
  await saveFormVersion(doc, adminId);
  return formatForm(doc.toObject());
}

export async function archiveCheckoutForm(id, adminId = null) {
  const doc = await CheckoutForm.findById(id);
  if (!doc) throwError("Checkout form not found.", 404);
  if (doc.scope === "global") throwError("Global form cannot be archived.");
  doc.status = "archived";
  if (adminId) doc.updatedBy = adminId;
  await doc.save();
  return formatForm(doc.toObject());
}

function buildEventApplyQuery(options = {}) {
  const query = {};
  const applyTo = options.applyTo || "all_draft_published";
  if (applyTo === "draft") query.status = "draft";
  else if (applyTo === "published") query.status = "published";
  else if (applyTo === "draft_published") query.status = { $in: ["draft", "published"] };
  else if (applyTo === "future") {
    query.date = { $gte: new Date() };
    query.status = { $in: ["draft", "published"] };
  }
  if (options.category) query.category = options.category;
  if (options.eventType) query.category = options.eventType;
  if (Array.isArray(options.eventIds) && options.eventIds.length) {
    query._id = { $in: options.eventIds };
  }
  if (options.onlyWithoutForm) {
    query.$or = [
      { assignedCheckoutFormId: null },
      { assignedCheckoutFormId: { $exists: false } },
      { checkoutFormMode: "global_fallback" },
    ];
  } else if (!options.overwriteExisting) {
    query.$or = [
      { assignedCheckoutFormId: null },
      { assignedCheckoutFormId: { $exists: false } },
      { checkoutFormMode: "global_fallback" },
    ];
  }
  return query;
}

export async function applyCheckoutFormToEvents(formId, options = {}, adminId = null) {
  const form = await CheckoutForm.findById(formId);
  if (!form) throwError("Checkout form not found.", 404);
  if (form.status === "archived") throwError("Cannot apply an archived form to events.");
  if (form.status === "draft") throwError("Only published forms can be applied to events.");

  const query = buildEventApplyQuery(options);
  const events = await Event.find(query).select("_id title status").lean();
  if (!events.length) return { updated: 0, eventIds: [] };

  const mode = options.createEventCopy ? "event_specific_copy" : "linked_standard";
  const source = options.createEventCopy ? "event_specific" : "standard";
  let updated = 0;
  const eventIds = [];

  for (const ev of events) {
    if (options.createEventCopy) {
      const copyFields = (form.fields || []).map((f) => ({ ...f }));
      const copy = await CheckoutForm.create({
        formId: await nextFormId(),
        name: `${form.name} — ${ev.title}`,
        description: form.description || "",
        formType: form.formType,
        scope: "event",
        eventId: ev._id,
        fields: copyFields,
        defaultFieldsSnapshot: copyFields.map((f) => ({ ...f })),
        status: "published",
        version: 1,
        publishedAt: new Date(),
        createdBy: adminId || null,
        updatedBy: adminId || null,
      });
      await Event.updateOne(
        { _id: ev._id },
        {
          assignedCheckoutFormId: copy._id,
          checkoutFormSource: "event_specific",
          checkoutFormMode: "event_specific_copy",
        }
      );
    } else {
      await Event.updateOne(
        { _id: ev._id },
        {
          assignedCheckoutFormId: form._id,
          checkoutFormSource: source,
          checkoutFormMode: mode,
        }
      );
    }
    eventIds.push(ev._id.toString());
    updated += 1;
  }
  return { updated, eventIds };
}

export async function updateEventCheckoutForm(eventId, payload, adminId = null) {
  const event = await Event.findById(eventId);
  if (!event) throwError("Event not found.", 404);

  const action = payload.action || "assign";

  if (action === "reset_global") {
    event.assignedCheckoutFormId = null;
    event.checkoutFormSource = "global";
    event.checkoutFormMode = "global_fallback";
    await event.save();
    return { event: await formatEventCheckout(event) };
  }

  if (action === "create_copy" && payload.formId) {
    const source = await CheckoutForm.findById(payload.formId);
    if (!source) throwError("Checkout form not found.", 404);
    const fields = (source.fields || []).map((f) => ({ ...f }));
    const copy = await CheckoutForm.create({
      formId: await nextFormId(),
      name: `${source.name} — ${event.title}`,
      description: source.description || "",
      formType: source.formType,
      scope: "event",
      eventId: event._id,
      fields,
      defaultFieldsSnapshot: fields.map((f) => ({ ...f })),
      status: "published",
      version: 1,
      publishedAt: new Date(),
      createdBy: adminId || null,
      updatedBy: adminId || null,
    });
    event.assignedCheckoutFormId = copy._id;
    event.checkoutFormSource = "event_specific";
    event.checkoutFormMode = "event_specific_copy";
    await event.save();
    return { event: await formatEventCheckout(event), form: await formatForm(copy.toObject()) };
  }

  if (payload.formId) {
    const form = await CheckoutForm.findById(payload.formId);
    if (!form) throwError("Checkout form not found.", 404);
    if (form.status === "archived") throwError("Cannot assign an archived form.");
    event.assignedCheckoutFormId = form._id;
    event.checkoutFormSource = payload.checkoutFormSource || (form.scope === "standard" ? "standard" : form.scope);
    event.checkoutFormMode = payload.checkoutFormMode || (form.scope === "event" ? "event_specific_copy" : "linked_standard");
    await event.save();
    return { event: await formatEventCheckout(event), form: await formatForm(form.toObject()) };
  }

  throwError("formId or action is required.");
}

export async function formatEventCheckout(event) {
  if (!event) return null;
  const ev = event.toObject ? event.toObject() : event;
  let assignedForm = null;
  if (ev.assignedCheckoutFormId) {
    const formDoc = await CheckoutForm.findById(ev.assignedCheckoutFormId).lean();
    if (formDoc) assignedForm = await formatForm(formDoc);
  }
  return {
    assignedCheckoutFormId: ev.assignedCheckoutFormId?.toString?.() || null,
    checkoutFormSource: ev.checkoutFormSource || "global",
    checkoutFormMode: ev.checkoutFormMode || "global_fallback",
    assignedForm,
  };
}

export async function deleteCheckoutForm(id) {
  const assigned = await Event.countDocuments({ assignedCheckoutFormId: id });
  if (assigned > 0) throwError("Form is assigned to events and cannot be deleted. Archive it instead.");
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

async function getPublishedForm(query) {
  const doc = await CheckoutForm.findOne({ ...query, status: "published" }).lean();
  if (doc) return doc;
  const draft = await CheckoutForm.findOne({ ...query, status: "draft" }).lean();
  if (draft) {
    const lastPublished = await CheckoutFormVersion.findOne({
      formId: draft.formId,
      status: "published",
    })
      .sort({ version: -1 })
      .lean();
    if (lastPublished) {
      return {
        ...draft,
        fields: lastPublished.fields,
        version: lastPublished.version,
        status: "published",
      };
    }
  }
  return null;
}

async function resolvePrimaryForm(payload = {}) {
  const eventId = payload.eventId || null;
  const eventType = await getEventTypeFromContext(eventId, payload.eventType || "");
  const ticketTypeIds = (payload.ticketTypeIds || []).map((t) => String(t));

  let event = null;
  if (eventId) {
    event = await Event.findById(eventId).lean();
  }

  // Priority 1: Ticket Type Form
  if (ticketTypeIds.length) {
    const ticketForms = await CheckoutForm.find({
      scope: "ticket_type",
      ticketTypeId: { $in: ticketTypeIds },
      status: "published",
    }).lean();
    if (ticketForms.length) return { forms: ticketForms.map(formatFormSync), source: "ticket_type" };
  }

  // Priority 2: Event-Specific Form
  if (event?.checkoutFormMode === "event_specific_copy" && event.assignedCheckoutFormId) {
    const evForm = await getPublishedForm({ _id: event.assignedCheckoutFormId, scope: "event" });
    if (evForm) return { forms: [formatFormSync(evForm)], source: "event_specific" };
  }
  const eventScoped = eventId ? await getPublishedForm({ scope: "event", eventId }) : null;
  if (eventScoped) return { forms: [formatFormSync(eventScoped)], source: "event_specific" };

  // Priority 3: Assigned Standard Form
  if (event?.assignedCheckoutFormId && event.checkoutFormMode === "linked_standard") {
    const stdForm = await getPublishedForm({ _id: event.assignedCheckoutFormId });
    if (stdForm) return { forms: [formatFormSync(stdForm)], source: "standard" };
  }

  // Priority 4: Event Type Form
  if (eventType) {
    const typeForm = await getPublishedForm({ scope: "event_type", eventType });
    if (typeForm) return { forms: [formatFormSync(typeForm)], source: "event_type" };
  }

  // Priority 5: Global Form
  let global = await getPublishedForm({ scope: "global" });
  if (!global) {
    await ensureGlobalCheckoutForm();
    global = await CheckoutForm.findOne({ scope: "global", status: "published" }).lean();
  }
  return { forms: [formatFormSync(global)], source: "global" };
}

function formatFormSync(doc) {
  return {
    id: doc._id?.toString() || doc.id,
    formId: doc.formId,
    name: doc.name,
    scope: doc.scope,
    formType: doc.formType,
    version: doc.version || 1,
    status: doc.status,
    fields: (doc.fields || []).map((f) => ({ ...f })),
  };
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

function deduplicateFields(fields) {
  const seen = new Set();
  const out = [];
  for (const field of fields) {
    if (CORE_CUSTOMER_FIELD_IDS.has(field.fieldId) && field.repeatIndex === 0 && !field.ticketTypeId) {
      if (seen.has(field.fieldId)) continue;
      seen.add(field.fieldId);
    }
    out.push(field);
  }
  return out;
}

export async function resolveCheckoutForms(payload = {}) {
  const { resolveCheckoutForms: resolveMerged } = await import("./booking/CheckoutFormResolver.js");
  return resolveMerged(payload);
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
  const resolved = await resolveCheckoutForms({ ...payload, hideCollectedFields: false });
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const answerKey = (fieldId, repeatIndex, ticketTypeId) =>
    `${fieldId}__${repeatIndex}__${ticketTypeId || ""}`;
  const map = new Map(
    answers.map((a) => [
      answerKey(a.questionId || a.fieldId, Number(a.repeatIndex || 0), a.ticketTypeId ? String(a.ticketTypeId) : ""),
      a,
    ])
  );

  // Merge known answers from attendee profile
  const known = payload.knownAnswers || {};
  for (const [fieldId, value] of Object.entries(known)) {
    const key = answerKey(fieldId, 0, "");
    if (!map.has(key) && value != null && value !== "") {
      map.set(key, { questionId: fieldId, answer: value, repeatIndex: 0, ticketTypeId: null });
    }
  }

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
    formVersion: validated.resolved.formVersion || 1,
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
  if (filters.formId) query.formId = filters.formId;
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

export { PROTECTED_CORE_FIELD_IDS, CORE_CUSTOMER_FIELD_IDS };
