import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import * as ctrl from "../controllers/eventOperationsController.js";

const router = Router();

router.use(requireAdmin);

router.get("/", requirePermission("documents.view"), ctrl.listAllDocuments);
router.get("/:documentId", requirePermission("documents.view"), ctrl.getGlobalDocument);
router.post("/upload", requirePermission("documents.edit"), ctrl.uploadGlobalDocument);

export default router;
