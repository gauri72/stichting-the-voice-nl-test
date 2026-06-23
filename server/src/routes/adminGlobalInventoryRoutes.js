import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import * as ctrl from "../controllers/eventOperationsController.js";

const router = Router();

router.use(requireAdmin);

router.get("/config", requirePermission("inventory.view"), ctrl.getConfig);
router.get("/", requirePermission("inventory.view"), ctrl.listGlobalInventory);
router.post("/", requirePermission("inventory.edit"), ctrl.createGlobalInventory);
router.patch("/:itemId", requirePermission("inventory.edit"), ctrl.updateGlobalInventory);
router.delete("/:itemId", requirePermission("inventory.edit"), ctrl.deleteGlobalInventory);
router.post("/:itemId/assign", requirePermission("inventory.edit"), ctrl.assignGlobalInventory);

export default router;
