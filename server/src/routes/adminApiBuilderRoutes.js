import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireSmartApiPermission } from "../middleware/smartApiMiddleware.js";
import {
  getConfig,
  listIntegrationsAdmin,
  getIntegrationAdmin,
  createIntegrationAdmin,
  patchIntegrationAdmin,
  deleteIntegrationAdmin,
  testIntegrationAdmin,
  activateIntegrationAdmin,
  deactivateIntegrationAdmin,
  listLogsAdmin,
  getLogAdmin,
  retryLogAdmin,
  resolveLogAdmin,
} from "../controllers/smartApiBuilderController.js";

const router = Router();
router.use(requireAdmin);

router.get("/config", requireSmartApiPermission("api_builder.read"), getConfig);
router.get("/integrations", requireSmartApiPermission("api_builder.read"), listIntegrationsAdmin);
router.post("/integrations", requireSmartApiPermission("api_builder.write"), createIntegrationAdmin);
router.get("/integrations/:id", requireSmartApiPermission("api_builder.read"), getIntegrationAdmin);
router.patch("/integrations/:id", requireSmartApiPermission("api_builder.write"), patchIntegrationAdmin);
router.delete("/integrations/:id", requireSmartApiPermission("api_builder.write"), deleteIntegrationAdmin);
router.post("/integrations/:id/test", requireSmartApiPermission("api_builder.test"), testIntegrationAdmin);
router.post("/integrations/:id/activate", requireSmartApiPermission("api_builder.write"), activateIntegrationAdmin);
router.post("/integrations/:id/deactivate", requireSmartApiPermission("api_builder.write"), deactivateIntegrationAdmin);

router.get("/logs", requireSmartApiPermission("api_builder.read"), listLogsAdmin);
router.get("/logs/:id", requireSmartApiPermission("api_builder.read"), getLogAdmin);
router.post("/logs/:id/retry", requireSmartApiPermission("api_builder.test"), retryLogAdmin);
router.post("/logs/:id/resolve", requireSmartApiPermission("api_builder.write"), resolveLogAdmin);

export default router;
