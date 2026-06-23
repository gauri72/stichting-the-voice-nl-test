import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventInventoryItem from "../models/EventInventoryItem.js";
import GlobalInventoryItem from "../models/GlobalInventoryItem.js";
import TechnicalRiderItem from "../models/TechnicalRiderItem.js";
import StagePlan from "../models/StagePlan.js";
import StagePlanElement from "../models/StagePlanElement.js";
import EventDocument from "../models/EventDocument.js";
import DocumentVersion from "../models/DocumentVersion.js";
import EventChecklistItem from "../models/EventChecklistItem.js";
import EventVendor from "../models/EventVendor.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import {
  CHECKLIST_CATEGORIES,
  INVENTORY_STATUSES,
  OPERATIONS_AUDIT_ACTIONS,
  TECHNICAL_RIDER_STATUSES,
} from "../config/eventOperationsConfig.js";
import {
  saveOperationsFile,
  saveStagePlanImage,
  saveGlobalInventoryImage,
} from "./eventDocumentUploadService.js";

function throwError(msg, status = 400) {
  const err = new Error(msg);
  err.status = status;
  throw err;
}

function oid(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throwError("Invalid ID.", 400);
  return new mongoose.Types.ObjectId(id);
}

async function ensureEvent(eventId) {
  const event = await Event.findById(eventId).lean();
  if (!event) throwError("Event not found.", 404);
  return event;
}

function formatInventory(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    ...d,
    id: String(d._id),
    cost: (d.costMinor || 0) / 100,
    deposit: (d.depositMinor || 0) / 100,
  };
}

function formatGlobalInventory(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    ...d,
    id: String(d._id),
    replacementCost: (d.replacementCostMinor || 0) / 100,
  };
}

function formatRider(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return { ...d, id: String(d._id) };
}

function formatDocument(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return { ...d, id: String(d._id) };
}

function formatChecklist(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return { ...d, id: String(d._id) };
}

function formatVendor(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return { ...d, id: String(d._id) };
}

async function logAudit(admin, action, details = {}) {
  try {
    await AdminAuditLog.create({
      adminId: admin?._id || admin?.id,
      adminEmail: admin?.email || "",
      action,
      module: "event_operations",
      details,
    });
  } catch {
    /* non-blocking */
  }
}

const DEFAULT_CHECKLIST_TASKS = [
  { task: "Venue confirmed", category: "Venue" },
  { task: "Sound confirmed", category: "Sound" },
  { task: "Lighting confirmed", category: "Lighting" },
  { task: "DJ setup confirmed", category: "Sound" },
  { task: "Stage plan approved", category: "Stage" },
  { task: "Sponsorship banners printed", category: "Sponsorship" },
  { task: "Tickets tested", category: "Tickets" },
  { task: "QR check-in tested", category: "Tickets" },
  { task: "Volunteers assigned", category: "Volunteers" },
  { task: "Food vendor confirmed", category: "Food" },
  { task: "Photographer confirmed", category: "Photography" },
  { task: "Final budget updated", category: "Budget" },
];

export async function getOperationsOverview(eventId) {
  await ensureEvent(eventId);
  const eid = oid(eventId);
  const [
    inventory,
    rider,
    documents,
    checklists,
    vendors,
    stagePlans,
    event,
  ] = await Promise.all([
    EventInventoryItem.find({ eventId: eid }).lean(),
    TechnicalRiderItem.find({ eventId: eid }).lean(),
    EventDocument.find({ eventId: eid, archived: false }).lean(),
    EventChecklistItem.find({ eventId: eid }).lean(),
    EventVendor.find({ eventId: eid }).lean(),
    StagePlan.find({ eventId: eid }).lean(),
    Event.findById(eid).lean(),
  ]);

  const totalInventory = inventory.length;
  const itemsArranged = inventory.filter((i) =>
    ["Confirmed", "Delivered", "In Use", "Returned"].includes(i.status)
  ).length;
  const itemsPending = inventory.filter((i) =>
    ["Needed", "Requested"].includes(i.status)
  ).length;

  const riderTotal = rider.length;
  const riderComplete = rider.filter((r) =>
    ["Confirmed", "Delivered", "Complete"].includes(r.status)
  ).length;
  const riderCompletion = riderTotal ? Math.round((riderComplete / riderTotal) * 100) : 0;

  const docsUploaded = documents.length;
  const requiredCategories = ["Contract", "Permit", "Technical"];
  const missingDocs = requiredCategories.filter(
    (cat) => !documents.some((d) => d.category === cat)
  ).length;

  const vendorConfirmations = vendors.filter((v) => v.confirmed).length;
  const openTasks = checklists.filter((c) => c.status !== "Done").length;

  return {
    event: {
      id: String(event._id),
      title: event.title,
      date: event.date,
      venueName: event.venueName,
      operationsEnabled: event.operationsEnabled !== false,
      inventoryStatus: event.inventoryStatus,
      technicalRiderStatus: event.technicalRiderStatus,
      stagePlanStatus: event.stagePlanStatus,
      documentsStatus: event.documentsStatus,
      operationsNotes: event.operationsNotes || "",
    },
    stats: {
      totalInventoryItems: totalInventory,
      itemsArranged,
      itemsPending,
      technicalRiderCompletion: riderCompletion,
      documentsUploaded: docsUploaded,
      missingDocuments: missingDocs,
      vendorConfirmations,
      vendorsTotal: vendors.length,
      openTasks,
      stagePlansCount: stagePlans.length,
    },
  };
}

export async function patchEventOperationsMeta(eventId, payload = {}) {
  await ensureEvent(eventId);
  const update = {};
  const allowed = [
    "operationsEnabled",
    "inventoryStatus",
    "technicalRiderStatus",
    "stagePlanStatus",
    "documentsStatus",
    "operationsNotes",
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) update[key] = payload[key];
  }
  const event = await Event.findByIdAndUpdate(eventId, update, { new: true }).lean();
  return { event: { id: String(event._id), ...update } };
}

// ——— Inventory ———

export async function listEventInventory(eventId, query = {}) {
  await ensureEvent(eventId);
  const filter = { eventId: oid(eventId) };
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.itemName = { $regex: query.search.trim(), $options: "i" };
  }
  const items = await EventInventoryItem.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  return { items: items.map(formatInventory) };
}

export async function createEventInventoryItem(eventId, payload, admin) {
  await ensureEvent(eventId);
  const doc = await EventInventoryItem.create({
    eventId: oid(eventId),
    itemName: payload.itemName,
    category: payload.category,
    quantityNeeded: payload.quantityNeeded ?? 1,
    quantityConfirmed: payload.quantityConfirmed ?? 0,
    quantityUsed: payload.quantityUsed ?? 0,
    unit: payload.unit,
    source: payload.source,
    owner: payload.owner,
    supplierVendor: payload.supplierVendor,
    vendorId: payload.vendorId || null,
    globalInventoryItemId: payload.globalInventoryItemId || null,
    costMinor: Math.round((Number(payload.cost) || 0) * 100),
    depositMinor: Math.round((Number(payload.deposit) || 0) * 100),
    returnRequired: Boolean(payload.returnRequired),
    returnStatus: payload.returnStatus,
    conditionBefore: payload.conditionBefore,
    conditionAfter: payload.conditionAfter,
    notes: payload.notes,
    assignedTeamMember: payload.assignedTeamMember,
    status: payload.status || "Needed",
    createdBy: admin?._id || admin?.id,
  });
  return { item: formatInventory(doc) };
}

export async function updateEventInventoryItem(eventId, itemId, payload) {
  await ensureEvent(eventId);
  const update = { ...payload };
  if (payload.cost !== undefined) update.costMinor = Math.round(Number(payload.cost) * 100);
  if (payload.deposit !== undefined) update.depositMinor = Math.round(Number(payload.deposit) * 100);
  delete update.cost;
  delete update.deposit;
  const doc = await EventInventoryItem.findOneAndUpdate(
    { _id: oid(itemId), eventId: oid(eventId) },
    update,
    { new: true }
  );
  if (!doc) throwError("Inventory item not found.", 404);
  return { item: formatInventory(doc) };
}

export async function deleteEventInventoryItem(eventId, itemId) {
  const result = await EventInventoryItem.deleteOne({ _id: oid(itemId), eventId: oid(eventId) });
  if (!result.deletedCount) throwError("Inventory item not found.", 404);
  return { ok: true };
}

export async function duplicateEventInventoryItem(eventId, itemId) {
  const source = await EventInventoryItem.findOne({ _id: oid(itemId), eventId: oid(eventId) });
  if (!source) throwError("Inventory item not found.", 404);
  const copy = source.toObject();
  delete copy._id;
  copy.itemName = `${copy.itemName} (copy)`;
  copy.status = "Needed";
  const doc = await EventInventoryItem.create(copy);
  return { item: formatInventory(doc) };
}

export async function copyInventoryFromEvent(targetEventId, sourceEventId, admin) {
  await ensureEvent(targetEventId);
  await ensureEvent(sourceEventId);
  const items = await EventInventoryItem.find({ eventId: oid(sourceEventId) }).lean();
  const created = [];
  for (const item of items) {
    const doc = await EventInventoryItem.create({
      eventId: oid(targetEventId),
      itemName: item.itemName,
      category: item.category,
      quantityNeeded: item.quantityNeeded,
      unit: item.unit,
      source: item.source,
      owner: item.owner,
      supplierVendor: item.supplierVendor,
      costMinor: item.costMinor,
      depositMinor: item.depositMinor,
      returnRequired: item.returnRequired,
      notes: item.notes,
      status: "Needed",
      createdBy: admin?._id || admin?.id,
    });
    created.push(formatInventory(doc));
  }
  return { items: created, count: created.length };
}

export async function exportInventoryCsv(eventId) {
  const { items } = await listEventInventory(eventId);
  const header = [
    "Item",
    "Category",
    "Qty Needed",
    "Qty Confirmed",
    "Qty Used",
    "Unit",
    "Status",
    "Supplier",
    "Cost",
    "Notes",
  ];
  const rows = items.map((i) =>
    [
      i.itemName,
      i.category,
      i.quantityNeeded,
      i.quantityConfirmed,
      i.quantityUsed,
      i.unit,
      i.status,
      i.supplierVendor,
      i.cost,
      (i.notes || "").replace(/"/g, '""'),
    ]
      .map((v) => `"${v ?? ""}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

// ——— Global inventory ———

export async function listGlobalInventory(query = {}) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.search) filter.itemName = { $regex: query.search.trim(), $options: "i" };
  const items = await GlobalInventoryItem.find(filter).sort({ itemName: 1 });
  return { items: items.map(formatGlobalInventory) };
}

export async function createGlobalInventoryItem(payload, admin) {
  let imageUrl = payload.imageUrl || "";
  if (payload.imageData?.startsWith("data:")) {
    const saved = await saveGlobalInventoryImage(payload.imageData);
    imageUrl = saved.fileUrl;
  }
  const doc = await GlobalInventoryItem.create({
    itemName: payload.itemName,
    category: payload.category,
    ownershipType: payload.ownershipType,
    quantityAvailable: payload.quantityAvailable ?? 1,
    storageLocation: payload.storageLocation,
    defaultSupplier: payload.defaultSupplier,
    replacementCostMinor: Math.round((Number(payload.replacementCost) || 0) * 100),
    notes: payload.notes,
    imageUrl,
    condition: payload.condition,
    status: payload.status || "Available",
    createdBy: admin?._id || admin?.id,
  });
  return { item: formatGlobalInventory(doc) };
}

export async function updateGlobalInventoryItem(itemId, payload) {
  const update = { ...payload };
  if (payload.replacementCost !== undefined) {
    update.replacementCostMinor = Math.round(Number(payload.replacementCost) * 100);
  }
  delete update.replacementCost;
  if (payload.imageData?.startsWith("data:")) {
    const saved = await saveGlobalInventoryImage(payload.imageData);
    update.imageUrl = saved.fileUrl;
  }
  delete update.imageData;
  const doc = await GlobalInventoryItem.findByIdAndUpdate(itemId, update, { new: true });
  if (!doc) throwError("Global inventory item not found.", 404);
  return { item: formatGlobalInventory(doc) };
}

export async function deleteGlobalInventoryItem(itemId) {
  const result = await GlobalInventoryItem.deleteOne({ _id: oid(itemId) });
  if (!result.deletedCount) throwError("Global inventory item not found.", 404);
  return { ok: true };
}

export async function assignGlobalItemToEvent(globalItemId, eventId, payload, admin) {
  const global = await GlobalInventoryItem.findById(globalItemId);
  if (!global) throwError("Global inventory item not found.", 404);
  await ensureEvent(eventId);
  const qty = payload.quantity ?? 1;
  const doc = await EventInventoryItem.create({
    eventId: oid(eventId),
    itemName: global.itemName,
    category: global.category,
    quantityNeeded: qty,
    source: global.ownershipType,
    owner: "V.O.I.C.E. NL",
    supplierVendor: global.defaultSupplier,
    globalInventoryItemId: global._id,
    costMinor: global.replacementCostMinor,
    notes: global.notes,
    status: "Requested",
    createdBy: admin?._id || admin?.id,
  });
  global.usageHistory.push({
    eventId: oid(eventId),
    quantity: qty,
    usedAt: new Date(),
    notes: payload.notes || "",
  });
  await global.save();
  return { item: formatInventory(doc) };
}

// ——— Technical rider ———

export async function listTechnicalRider(eventId, query = {}) {
  await ensureEvent(eventId);
  const filter = { eventId: oid(eventId) };
  if (query.section) filter.section = query.section;
  const items = await TechnicalRiderItem.find(filter).sort({ section: 1, sortOrder: 1 });
  return { items: items.map(formatRider) };
}

export async function createTechnicalRiderItem(eventId, payload, admin) {
  await ensureEvent(eventId);
  const doc = await TechnicalRiderItem.create({
    eventId: oid(eventId),
    section: payload.section,
    requirement: payload.requirement,
    quantity: payload.quantity ?? 1,
    specification: payload.specification,
    responsiblePerson: payload.responsiblePerson,
    supplier: payload.supplier,
    vendorId: payload.vendorId || null,
    status: payload.status || "Needed",
    notes: payload.notes,
    createdBy: admin?._id || admin?.id,
  });
  return { item: formatRider(doc) };
}

export async function updateTechnicalRiderItem(eventId, itemId, payload) {
  const doc = await TechnicalRiderItem.findOneAndUpdate(
    { _id: oid(itemId), eventId: oid(eventId) },
    payload,
    { new: true }
  );
  if (!doc) throwError("Technical rider item not found.", 404);
  return { item: formatRider(doc) };
}

export async function deleteTechnicalRiderItem(eventId, itemId) {
  const result = await TechnicalRiderItem.deleteOne({ _id: oid(itemId), eventId: oid(eventId) });
  if (!result.deletedCount) throwError("Technical rider item not found.", 404);
  return { ok: true };
}

export async function copyTechnicalRiderFromEvent(targetEventId, sourceEventId, admin) {
  await ensureEvent(targetEventId);
  await ensureEvent(sourceEventId);
  const items = await TechnicalRiderItem.find({ eventId: oid(sourceEventId) }).lean();
  const created = [];
  for (const item of items) {
    const doc = await TechnicalRiderItem.create({
      eventId: oid(targetEventId),
      section: item.section,
      requirement: item.requirement,
      quantity: item.quantity,
      specification: item.specification,
      responsiblePerson: item.responsiblePerson,
      supplier: item.supplier,
      status: "Needed",
      notes: item.notes,
      createdBy: admin?._id || admin?.id,
    });
    created.push(formatRider(doc));
  }
  return { items: created, count: created.length };
}

// ——— Stage plan ———

export async function getStagePlans(eventId) {
  await ensureEvent(eventId);
  const plans = await StagePlan.find({ eventId: oid(eventId) }).sort({ isDefault: -1, createdAt: 1 });
  const result = [];
  for (const plan of plans) {
    const elements = await StagePlanElement.find({ planId: plan._id }).sort({ zIndex: 1 });
    result.push({
      id: String(plan._id),
      name: plan.name,
      floorImageUrl: plan.floorImageUrl,
      imageWidth: plan.imageWidth,
      imageHeight: plan.imageHeight,
      isDefault: plan.isDefault,
      notes: plan.notes,
      elements: elements.map((el) => ({ ...el.toObject(), id: String(el._id) })),
    });
  }
  return { plans: result };
}

export async function createStagePlan(eventId, payload, admin) {
  await ensureEvent(eventId);
  let floorImageUrl = payload.floorImageUrl || "";
  let imageWidth = payload.imageWidth || 0;
  let imageHeight = payload.imageHeight || 0;
  if (payload.floorImageData?.startsWith("data:")) {
    const saved = await saveStagePlanImage(payload.floorImageData);
    floorImageUrl = saved.fileUrl;
  }
  if (payload.isDefault) {
    await StagePlan.updateMany({ eventId: oid(eventId) }, { isDefault: false });
  }
  const plan = await StagePlan.create({
    eventId: oid(eventId),
    name: payload.name || "Main Layout",
    floorImageUrl,
    imageWidth,
    imageHeight,
    isDefault: payload.isDefault !== false,
    notes: payload.notes,
    createdBy: admin?._id || admin?.id,
  });
  if (Array.isArray(payload.elements)) {
    for (const el of payload.elements) {
      await StagePlanElement.create({
        planId: plan._id,
        eventId: oid(eventId),
        ...el,
      });
    }
  }
  return getStagePlans(eventId);
}

export async function updateStagePlan(eventId, planId, payload) {
  await ensureEvent(eventId);
  const update = { ...payload };
  if (payload.floorImageData?.startsWith("data:")) {
    const saved = await saveStagePlanImage(payload.floorImageData);
    update.floorImageUrl = saved.fileUrl;
  }
  delete update.floorImageData;
  delete update.elements;
  if (payload.isDefault) {
    await StagePlan.updateMany({ eventId: oid(eventId) }, { isDefault: false });
  }
  const plan = await StagePlan.findOneAndUpdate(
    { _id: oid(planId), eventId: oid(eventId) },
    update,
    { new: true }
  );
  if (!plan) throwError("Stage plan not found.", 404);
  if (Array.isArray(payload.elements)) {
    await StagePlanElement.deleteMany({ planId: plan._id });
    for (const el of payload.elements) {
      await StagePlanElement.create({
        planId: plan._id,
        eventId: oid(eventId),
        label: el.label,
        elementType: el.elementType,
        xPercent: el.xPercent,
        yPercent: el.yPercent,
        widthPercent: el.widthPercent,
        heightPercent: el.heightPercent,
        rotation: el.rotation,
        notes: el.notes,
        color: el.color,
        locked: el.locked,
        zIndex: el.zIndex,
      });
    }
  }
  return getStagePlans(eventId);
}

// ——— Documents ———

export async function listEventDocuments(eventId, query = {}) {
  await ensureEvent(eventId);
  const filter = { eventId: oid(eventId), archived: query.archived === "true" };
  if (query.category) filter.category = query.category;
  if (query.search) {
    filter.$or = [
      { documentName: { $regex: query.search.trim(), $options: "i" } },
      { tags: { $regex: query.search.trim(), $options: "i" } },
    ];
  }
  const docs = await EventDocument.find(filter).sort({ uploadedDate: -1 });
  return { documents: docs.map(formatDocument) };
}

export async function uploadEventDocument(eventId, payload, admin) {
  await ensureEvent(eventId);
  if (!payload.fileData?.startsWith("data:") && !payload.fileUrl) {
    throwError("File data is required.");
  }
  let fileMeta = {
    fileUrl: payload.fileUrl,
    mimeType: payload.mimeType || "",
    fileType: payload.fileType || "",
    fileSize: payload.fileSize || 0,
  };
  if (payload.fileData?.startsWith("data:")) {
    fileMeta = await saveOperationsFile({ dataUrl: payload.fileData });
  }
  const doc = await EventDocument.create({
    eventId: oid(eventId),
    documentName: payload.documentName || "Untitled document",
    category: payload.category || "Other",
    fileType: fileMeta.fileType,
    fileUrl: fileMeta.fileUrl,
    mimeType: fileMeta.mimeType,
    fileSize: fileMeta.fileSize,
    uploadedBy: admin?._id || admin?.id,
    uploadedByName: admin?.name || admin?.email || "",
    uploadedDate: new Date(),
    expiryDate: payload.expiryDate || null,
    currentVersion: 1,
    tags: payload.tags || [],
    notes: payload.notes,
    visibility: payload.visibility || "Internal",
    linkedVendorId: payload.linkedVendorId || null,
    linkedSponsorId: payload.linkedSponsorId || "",
  });
  await DocumentVersion.create({
    documentId: doc._id,
    eventId: oid(eventId),
    version: 1,
    fileUrl: fileMeta.fileUrl,
    fileType: fileMeta.fileType,
    mimeType: fileMeta.mimeType,
    fileSize: fileMeta.fileSize,
    uploadedBy: admin?._id || admin?.id,
    uploadedByName: admin?.name || admin?.email || "",
    changeNote: payload.changeNote || "Initial upload",
  });
  await logAudit(admin, OPERATIONS_AUDIT_ACTIONS.DOCUMENT_UPLOAD, {
    documentId: String(doc._id),
    eventId,
    name: doc.documentName,
  });
  return { document: formatDocument(doc) };
}

export async function updateEventDocument(eventId, documentId, payload, admin) {
  const doc = await EventDocument.findOne({ _id: oid(documentId), eventId: oid(eventId) });
  if (!doc) throwError("Document not found.", 404);
  if (payload.fileData?.startsWith("data:")) {
    const fileMeta = await saveOperationsFile({ dataUrl: payload.fileData });
    const newVersion = doc.currentVersion + 1;
    await DocumentVersion.create({
      documentId: doc._id,
      eventId: oid(eventId),
      version: newVersion,
      fileUrl: fileMeta.fileUrl,
      fileType: fileMeta.fileType,
      mimeType: fileMeta.mimeType,
      fileSize: fileMeta.fileSize,
      uploadedBy: admin?._id || admin?.id,
      uploadedByName: admin?.name || admin?.email || "",
      changeNote: payload.changeNote || "File replaced",
    });
    doc.fileUrl = fileMeta.fileUrl;
    doc.fileType = fileMeta.fileType;
    doc.mimeType = fileMeta.mimeType;
    doc.fileSize = fileMeta.fileSize;
    doc.currentVersion = newVersion;
    doc.uploadedDate = new Date();
  }
  const fields = [
    "documentName",
    "category",
    "expiryDate",
    "tags",
    "notes",
    "visibility",
    "linkedVendorId",
    "linkedSponsorId",
    "archived",
  ];
  for (const f of fields) {
    if (payload[f] !== undefined) doc[f] = payload[f];
  }
  await doc.save();
  return { document: formatDocument(doc) };
}

export async function deleteEventDocument(eventId, documentId, admin) {
  const doc = await EventDocument.findOneAndUpdate(
    { _id: oid(documentId), eventId: oid(eventId) },
    { archived: true },
    { new: true }
  );
  if (!doc) throwError("Document not found.", 404);
  await logAudit(admin, OPERATIONS_AUDIT_ACTIONS.DOCUMENT_DELETE, {
    documentId,
    eventId,
  });
  return { ok: true };
}

export async function getDocumentVersions(eventId, documentId) {
  const versions = await DocumentVersion.find({
    documentId: oid(documentId),
    eventId: oid(eventId),
  }).sort({ version: -1 });
  return {
    versions: versions.map((v) => ({
      ...v.toObject(),
      id: String(v._id),
    })),
  };
}

export async function restoreDocumentVersion(eventId, documentId, versionId, admin) {
  const version = await DocumentVersion.findOne({
    _id: oid(versionId),
    documentId: oid(documentId),
    eventId: oid(eventId),
  });
  if (!version) throwError("Version not found.", 404);
  const doc = await EventDocument.findOne({ _id: oid(documentId), eventId: oid(eventId) });
  if (!doc) throwError("Document not found.", 404);
  const newVersion = doc.currentVersion + 1;
  await DocumentVersion.create({
    documentId: doc._id,
    eventId: oid(eventId),
    version: newVersion,
    fileUrl: version.fileUrl,
    fileType: version.fileType,
    mimeType: version.mimeType,
    fileSize: version.fileSize,
    uploadedBy: admin?._id || admin?.id,
    uploadedByName: admin?.name || admin?.email || "",
    changeNote: `Restored from version ${version.version}`,
  });
  doc.fileUrl = version.fileUrl;
  doc.fileType = version.fileType;
  doc.mimeType = version.mimeType;
  doc.fileSize = version.fileSize;
  doc.currentVersion = newVersion;
  await doc.save();
  await logAudit(admin, OPERATIONS_AUDIT_ACTIONS.DOCUMENT_RESTORE, { documentId, versionId });
  return { document: formatDocument(doc) };
}

export async function listAllDocuments(query = {}) {
  const filter = { archived: query.archived === "true" };
  if (query.eventId) filter.eventId = oid(query.eventId);
  if (query.category) filter.category = query.category;
  if (query.year) {
    const y = Number(query.year);
    filter.uploadedDate = {
      $gte: new Date(`${y}-01-01`),
      $lt: new Date(`${y + 1}-01-01`),
    };
  }
  if (query.fileType) filter.fileType = query.fileType;
  if (query.search) {
    filter.$or = [
      { documentName: { $regex: query.search.trim(), $options: "i" } },
      { tags: { $regex: query.search.trim(), $options: "i" } },
    ];
  }
  const docs = await EventDocument.find(filter)
    .populate("eventId", "title date")
    .sort({ uploadedDate: -1 })
    .limit(500);
  return {
    documents: docs.map((d) => {
      const formatted = formatDocument(d);
      formatted.event = d.eventId
        ? { id: String(d.eventId._id), title: d.eventId.title, date: d.eventId.date }
        : null;
      return formatted;
    }),
  };
}

export async function getGlobalDocument(documentId) {
  const doc = await EventDocument.findById(documentId).populate("eventId", "title date");
  if (!doc) throwError("Document not found.", 404);
  const formatted = formatDocument(doc);
  formatted.event = doc.eventId
    ? { id: String(doc.eventId._id), title: doc.eventId.title, date: doc.eventId.date }
    : null;
  const { versions } = await getDocumentVersions(doc.eventId, documentId);
  return { document: formatted, versions };
}

// ——— Checklists ———

export async function listChecklists(eventId) {
  await ensureEvent(eventId);
  let items = await EventChecklistItem.find({ eventId: oid(eventId) }).sort({ sortOrder: 1 });
  if (!items.length) {
    await EventChecklistItem.insertMany(
      DEFAULT_CHECKLIST_TASKS.map((t, i) => ({
        eventId: oid(eventId),
        task: t.task,
        category: t.category,
        status: "Open",
        sortOrder: i,
      }))
    );
    items = await EventChecklistItem.find({ eventId: oid(eventId) }).sort({ sortOrder: 1 });
  }
  return { items: items.map(formatChecklist) };
}

export async function createChecklistItem(eventId, payload, admin) {
  await ensureEvent(eventId);
  const doc = await EventChecklistItem.create({
    eventId: oid(eventId),
    task: payload.task,
    category: payload.category || "Other",
    assignedTo: payload.assignedTo,
    dueDate: payload.dueDate || null,
    status: payload.status || "Open",
    notes: payload.notes,
    createdBy: admin?._id || admin?.id,
  });
  return { item: formatChecklist(doc) };
}

export async function updateChecklistItem(eventId, taskId, payload) {
  const doc = await EventChecklistItem.findOneAndUpdate(
    { _id: oid(taskId), eventId: oid(eventId) },
    payload,
    { new: true }
  );
  if (!doc) throwError("Checklist item not found.", 404);
  return { item: formatChecklist(doc) };
}

export async function deleteChecklistItem(eventId, taskId) {
  const result = await EventChecklistItem.deleteOne({ _id: oid(taskId), eventId: oid(eventId) });
  if (!result.deletedCount) throwError("Checklist item not found.", 404);
  return { ok: true };
}

// ——— Vendors ———

export async function listVendors(eventId) {
  await ensureEvent(eventId);
  const vendors = await EventVendor.find({ eventId: oid(eventId) }).sort({ vendorName: 1 });
  return { vendors: vendors.map(formatVendor) };
}

export async function createVendor(eventId, payload, admin) {
  await ensureEvent(eventId);
  const doc = await EventVendor.create({
    eventId: oid(eventId),
    vendorName: payload.vendorName,
    contactPerson: payload.contactPerson,
    email: payload.email,
    phone: payload.phone,
    serviceType: payload.serviceType,
    confirmed: Boolean(payload.confirmed),
    notes: payload.notes,
    createdBy: admin?._id || admin?.id,
  });
  return { vendor: formatVendor(doc) };
}

export async function updateVendor(eventId, vendorId, payload) {
  const doc = await EventVendor.findOneAndUpdate(
    { _id: oid(vendorId), eventId: oid(eventId) },
    payload,
    { new: true }
  );
  if (!doc) throwError("Vendor not found.", 404);
  return { vendor: formatVendor(doc) };
}

export async function deleteVendor(eventId, vendorId) {
  const result = await EventVendor.deleteOne({ _id: oid(vendorId), eventId: oid(eventId) });
  if (!result.deletedCount) throwError("Vendor not found.", 404);
  return { ok: true };
}

export async function listEventsForPicker() {
  const events = await Event.find({ archived: { $ne: true } })
    .select("title date venueName status")
    .sort({ date: -1 })
    .limit(200)
    .lean();
  return {
    events: events.map((e) => ({
      id: String(e._id),
      title: e.title,
      date: e.date,
      venueName: e.venueName,
      status: e.status,
    })),
  };
}

export {
  INVENTORY_STATUSES,
  CHECKLIST_CATEGORIES,
  TECHNICAL_RIDER_STATUSES,
};
