import { Router } from "express";
import { requirePermission, requireEventAccess } from "../middleware/rbacMiddleware.js";
import * as ctrl from "../controllers/eventOperationsController.js";

const router = Router({ mergeParams: true });

const viewInv = requirePermission("inventory.view");
const editInv = requirePermission("inventory.edit");
const viewDocs = requirePermission("documents.view");
const editDocs = requirePermission("documents.edit");
const eventAccess = requireEventAccess("eventId");

router.use(eventAccess);

router.get("/operations/config", viewInv, ctrl.getConfig);
router.get("/operations", viewInv, ctrl.getOverview);
router.patch("/operations", editInv, ctrl.patchOverviewMeta);
router.post("/operations/export", viewInv, ctrl.exportOperationsFile);
router.get("/operations/events-picker", viewInv, ctrl.listEventsPicker);

router.get("/inventory", viewInv, ctrl.listInventory);
router.post("/inventory", editInv, ctrl.createInventory);
router.post("/inventory/copy-from-event", editInv, ctrl.copyInventory);
router.patch("/inventory/:itemId", editInv, ctrl.updateInventory);
router.delete("/inventory/:itemId", editInv, ctrl.deleteInventory);
router.post("/inventory/:itemId/duplicate", editInv, ctrl.duplicateInventory);

router.get("/technical-rider", viewInv, ctrl.listRider);
router.post("/technical-rider", editInv, ctrl.createRider);
router.post("/technical-rider/copy-from-event", editInv, ctrl.copyRider);
router.patch("/technical-rider/:itemId", editInv, ctrl.updateRider);
router.delete("/technical-rider/:itemId", editInv, ctrl.deleteRider);

router.get("/stage-plan", viewInv, ctrl.getStagePlan);
router.post("/stage-plan", editInv, ctrl.createStagePlan);
router.patch("/stage-plan/:planId", editInv, ctrl.updateStagePlan);
router.post("/stage-plan/export", viewInv, ctrl.exportOperationsFile);

router.get("/documents", viewDocs, ctrl.listDocuments);
router.post("/documents/upload", editDocs, ctrl.uploadDocument);
router.patch("/documents/:documentId", editDocs, ctrl.updateDocument);
router.delete("/documents/:documentId", editDocs, ctrl.deleteDocument);
router.get("/documents/:documentId/versions", viewDocs, ctrl.getVersions);
router.post("/documents/:documentId/versions/:versionId/restore", editDocs, ctrl.restoreVersion);

router.get("/checklists", viewInv, ctrl.listChecklists);
router.post("/checklists", editInv, ctrl.createChecklist);
router.patch("/checklists/:taskId", editInv, ctrl.updateChecklist);
router.delete("/checklists/:taskId", editInv, ctrl.deleteChecklist);

router.get("/vendors", viewInv, ctrl.listVendors);
router.post("/vendors", editInv, ctrl.createVendor);
router.patch("/vendors/:vendorId", editInv, ctrl.updateVendor);
router.delete("/vendors/:vendorId", editInv, ctrl.deleteVendor);

export default router;
