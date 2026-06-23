import { Router } from "express";
import {
  getDashboard,
  patchDashboard,
  listWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  duplicateWidget,
  reorderWidgets,
  publishDashboard,
  getDashboardBuilder,
  listReports,
  createReport,
  runReport,
  getInsights,
  getDashboardConfig,
  resetDashboard,
} from "../controllers/adminDashboardBuilderController.js";
import { requireDashboardPermission } from "../middleware/dashboardMiddleware.js";

const router = Router();

router.get("/config", requireDashboardPermission("dashboard.read"), getDashboardConfig);
router.get("/builder", requireDashboardPermission("dashboard.read"), getDashboardBuilder);
router.get("/insights", requireDashboardPermission("dashboard.read"), getInsights);
router.get("/reports", requireDashboardPermission("dashboard.read"), listReports);
router.post("/reports", requireDashboardPermission("reports.write"), createReport);
router.post("/reports/:id/run", requireDashboardPermission("dashboard.read"), runReport);

router.get("/widgets", requireDashboardPermission("dashboard.read"), listWidgets);
router.post("/widgets", requireDashboardPermission("dashboard.write"), createWidget);
router.post("/widgets/reorder", requireDashboardPermission("dashboard.write"), reorderWidgets);
router.patch("/widgets/:id", requireDashboardPermission("dashboard.write"), updateWidget);
router.delete("/widgets/:id", requireDashboardPermission("dashboard.write"), deleteWidget);
router.post("/widgets/:id/duplicate", requireDashboardPermission("dashboard.write"), duplicateWidget);

router.post("/publish", requireDashboardPermission("dashboard.publish"), publishDashboard);
router.post("/reset", requireDashboardPermission("dashboard.write"), resetDashboard);

router.get("/", requireDashboardPermission("dashboard.read"), getDashboard);
router.patch("/", requireDashboardPermission("dashboard.write"), patchDashboard);

export default router;
