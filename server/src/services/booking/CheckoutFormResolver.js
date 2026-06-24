import CheckoutForm from "../../models/CheckoutForm.js";
import Event from "../../models/Event.js";
import { deduplicateCheckoutFields } from "./CheckoutFieldNormalizer.js";

const CORE_CUSTOMER_FIELD_IDS = new Set(["first_name", "last_name", "email", "phone", "full_name"]);

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

function isFieldVisible(field, answerMap) {
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

async function getEventType(eventId, explicit = "") {
  if (explicit) return explicit;
  if (!eventId) return "";
  const event = await Event.findById(eventId).lean();
  return event?.category || "ticketed_event";
}

async function getPublishedForms(query) {
  return CheckoutForm.find({ ...query, status: "published" }).lean();
}

function formatFormLayer(doc) {
  return {
    id: doc._id?.toString(),
    formId: doc.formId,
    name: doc.name,
    scope: doc.scope,
    formType: doc.formType,
    version: doc.version || 1,
    fields: (doc.fields || []).map((f) => ({ ...f })),
  };
}

function mergeFormLayers(forms) {
  const merged = [];
  for (const form of forms) {
    for (const field of form.fields || []) {
      merged.push({
        ...field,
        sourceScope: form.scope,
        sourceFormId: form.formId,
        formVersion: form.version,
      });
    }
  }
  return merged.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

/**
 * Resolves and merges checkout forms in priority order:
 * Ticket Type → Event → Event Type → Global
 * Deduplicates core customer fields.
 */
export async function resolveCheckoutForms(payload = {}) {
  const eventId = payload.eventId || null;
  const eventType = await getEventType(eventId, payload.eventType || "");
  const ticketTypeIds = (payload.ticketTypeIds || []).map(String);
  const event = eventId ? await Event.findById(eventId).lean() : null;

  const layers = [];

  if (ticketTypeIds.length) {
    const ticketForms = await getPublishedForms({ scope: "ticket_type", ticketTypeId: { $in: ticketTypeIds } });
    layers.push(...ticketForms.map(formatFormLayer));
  }

  if (event?.assignedCheckoutFormId) {
    const assigned = await CheckoutForm.findOne({ _id: event.assignedCheckoutFormId, status: "published" }).lean();
    if (assigned) layers.push(formatFormLayer(assigned));
  }

  if (eventId) {
    const eventForms = await getPublishedForms({ scope: "event", eventId });
    for (const f of eventForms) layers.push(formatFormLayer(f));
  }

  if (eventType) {
    const typeForms = await getPublishedForms({ scope: "event_type", eventType });
    for (const f of typeForms) layers.push(formatFormLayer(f));
  }

  const globalForms = await getPublishedForms({ scope: "global" });
  if (globalForms.length) layers.push(formatFormLayer(globalForms[0]));
  else {
    const { ensureGlobalCheckoutForm } = await import("../checkoutFormService.js");
    const seeded = await ensureGlobalCheckoutForm();
    layers.push(seeded);
  }

  const uniqueLayers = [];
  const seenScopes = new Set();
  for (const layer of layers) {
    const key = `${layer.scope}:${layer.id}`;
    if (seenScopes.has(key)) continue;
    seenScopes.add(key);
    uniqueLayers.push(layer);
  }

  const mergedFields = mergeFormLayers(uniqueLayers);
  const context = {
    items: payload.items || [],
    ticketQuantity: Number(payload.ticketQuantity || 0),
    participantCount: Number(payload.participantCount || payload.ticketQuantity || 0),
  };

  const answerMap = new Map();
  for (const [k, v] of Object.entries(payload.knownAnswers || {})) {
    if (v != null && v !== "") answerMap.set(k, v);
  }

  const rendered = [];
  for (const field of mergedFields) {
    if (!isFieldVisible(field, answerMap)) continue;
    for (const inst of buildRepeatInstances(field, context)) {
      const hideOnReview = Boolean(
        payload.hideCollectedFields &&
          CORE_CUSTOMER_FIELD_IDS.has(field.fieldId) &&
          inst.repeatIndex === 0 &&
          !inst.ticketTypeId
      );
      rendered.push({
        ...field,
        repeatIndex: inst.repeatIndex,
        ticketTypeId: inst.ticketTypeId,
        hideOnReview,
      });
    }
  }

  const fields = deduplicateCheckoutFields(rendered);

  return {
    forms: uniqueLayers,
    resolvedPriority: ["ticket_type", "event", "event_type", "global"],
    fields,
    formVersion: uniqueLayers[uniqueLayers.length - 1]?.version || 1,
  };
}
