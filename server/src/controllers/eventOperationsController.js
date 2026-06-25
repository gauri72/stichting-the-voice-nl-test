import * as ops from "../services/eventOperationsService.js";
import { exportOperations } from "../services/eventOperationsExportService.js";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STATUSES,
  TECHNICAL_RIDER_SECTIONS,
  TECHNICAL_RIDER_STATUSES,
  DOCUMENT_CATEGORIES,
  CHECKLIST_STATUSES,
  CHECKLIST_CATEGORIES,
  STAGE_ELEMENT_TYPES,
  GLOBAL_INVENTORY_OWNERSHIP,
  GLOBAL_INVENTORY_STATUSES,
} from "../config/eventOperationsConfig.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[event-operations]" });
}

export function getConfig(_req, res) {
  res.json({
    inventoryCategories: INVENTORY_CATEGORIES,
    inventoryStatuses: INVENTORY_STATUSES,
    riderSections: TECHNICAL_RIDER_SECTIONS,
    riderStatuses: TECHNICAL_RIDER_STATUSES,
    documentCategories: DOCUMENT_CATEGORIES,
    checklistStatuses: CHECKLIST_STATUSES,
    checklistCategories: CHECKLIST_CATEGORIES,
    stageElementTypes: STAGE_ELEMENT_TYPES,
    globalOwnershipTypes: GLOBAL_INVENTORY_OWNERSHIP,
    globalInventoryStatuses: GLOBAL_INVENTORY_STATUSES,
  });
}

export async function getOverview(req, res) {
  try {
    const data = await ops.getOperationsOverview(req.params.eventId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function patchOverviewMeta(req, res) {
  try {
    const data = await ops.patchEventOperationsMeta(req.params.eventId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listInventory(req, res) {
  try {
    const data = await ops.listEventInventory(req.params.eventId, req.query);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createInventory(req, res) {
  try {
    const data = await ops.createEventInventoryItem(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateInventory(req, res) {
  try {
    const data = await ops.updateEventInventoryItem(req.params.eventId, req.params.itemId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteInventory(req, res) {
  try {
    await ops.deleteEventInventoryItem(req.params.eventId, req.params.itemId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function duplicateInventory(req, res) {
  try {
    const data = await ops.duplicateEventInventoryItem(req.params.eventId, req.params.itemId);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function copyInventory(req, res) {
  try {
    const { sourceEventId } = req.body;
    const data = await ops.copyInventoryFromEvent(req.params.eventId, sourceEventId, req.admin);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listGlobalInventory(req, res) {
  try {
    const data = await ops.listGlobalInventory(req.query);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createGlobalInventory(req, res) {
  try {
    const data = await ops.createGlobalInventoryItem(req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateGlobalInventory(req, res) {
  try {
    const data = await ops.updateGlobalInventoryItem(req.params.itemId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteGlobalInventory(req, res) {
  try {
    await ops.deleteGlobalInventoryItem(req.params.itemId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function assignGlobalInventory(req, res) {
  try {
    const data = await ops.assignGlobalItemToEvent(
      req.params.itemId,
      req.body.eventId,
      req.body,
      req.admin
    );
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listRider(req, res) {
  try {
    const data = await ops.listTechnicalRider(req.params.eventId, req.query);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createRider(req, res) {
  try {
    const data = await ops.createTechnicalRiderItem(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateRider(req, res) {
  try {
    const data = await ops.updateTechnicalRiderItem(req.params.eventId, req.params.itemId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteRider(req, res) {
  try {
    await ops.deleteTechnicalRiderItem(req.params.eventId, req.params.itemId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function copyRider(req, res) {
  try {
    const data = await ops.copyTechnicalRiderFromEvent(
      req.params.eventId,
      req.body.sourceEventId,
      req.admin
    );
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getStagePlan(req, res) {
  try {
    const data = await ops.getStagePlans(req.params.eventId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createStagePlan(req, res) {
  try {
    const data = await ops.createStagePlan(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateStagePlan(req, res) {
  try {
    const data = await ops.updateStagePlan(req.params.eventId, req.params.planId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listDocuments(req, res) {
  try {
    const data = await ops.listEventDocuments(req.params.eventId, req.query);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function uploadDocument(req, res) {
  try {
    const data = await ops.uploadEventDocument(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateDocument(req, res) {
  try {
    const data = await ops.updateEventDocument(
      req.params.eventId,
      req.params.documentId,
      req.body,
      req.admin
    );
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteDocument(req, res) {
  try {
    await ops.deleteEventDocument(req.params.eventId, req.params.documentId, req.admin);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getVersions(req, res) {
  try {
    const data = await ops.getDocumentVersions(req.params.eventId, req.params.documentId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function restoreVersion(req, res) {
  try {
    const data = await ops.restoreDocumentVersion(
      req.params.eventId,
      req.params.documentId,
      req.params.versionId,
      req.admin
    );
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listAllDocuments(req, res) {
  try {
    const data = await ops.listAllDocuments(req.query);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getGlobalDocument(req, res) {
  try {
    const data = await ops.getGlobalDocument(req.params.documentId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function uploadGlobalDocument(req, res) {
  try {
    const { eventId, ...rest } = req.body;
    if (!eventId) return res.status(400).json({ error: "eventId is required." });
    const data = await ops.uploadEventDocument(eventId, rest, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listChecklists(req, res) {
  try {
    const data = await ops.listChecklists(req.params.eventId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createChecklist(req, res) {
  try {
    const data = await ops.createChecklistItem(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateChecklist(req, res) {
  try {
    const data = await ops.updateChecklistItem(req.params.eventId, req.params.taskId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteChecklist(req, res) {
  try {
    await ops.deleteChecklistItem(req.params.eventId, req.params.taskId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listVendors(req, res) {
  try {
    const data = await ops.listVendors(req.params.eventId);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function createVendor(req, res) {
  try {
    const data = await ops.createVendor(req.params.eventId, req.body, req.admin);
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateVendor(req, res) {
  try {
    const data = await ops.updateVendor(req.params.eventId, req.params.vendorId, req.body);
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteVendor(req, res) {
  try {
    await ops.deleteVendor(req.params.eventId, req.params.vendorId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listEventsPicker(req, res) {
  try {
    const data = await ops.listEventsForPicker();
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
}

export async function exportOperationsFile(req, res) {
  try {
    const { type, plan } = req.body;
    const result = await exportOperations(type, req.params.eventId, { plan });
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (err) {
    handleError(res, err);
  }
}
