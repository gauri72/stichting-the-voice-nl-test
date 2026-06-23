import { Router } from "express";
import {
  getCustomerDashboard,
  patchCustomerDashboard,
  saveCustomerDashboardDraft,
  publishCustomerDashboard,
  createCustomerDashboardSection,
  updateCustomerDashboardSection,
  deleteCustomerDashboardSection,
  duplicateCustomerDashboardSection,
  reorderCustomerDashboardSections,
  toggleCustomerDashboardSectionVisibility,
  restoreCustomerDashboardVersion,
  listCustomerDashboardVersions,
  getCustomerDashboardConfig,
  getCustomerDashboardPreview,
} from "../controllers/adminCustomerDashboardController.js";
import { requireCustomerDashboardPermission } from "../middleware/customerDashboardMiddleware.js";

const router = Router();

router.get("/preview", requireCustomerDashboardPermission("customer_dashboard.read"), getCustomerDashboardPreview);
router.get("/config", requireCustomerDashboardPermission("customer_dashboard.read"), getCustomerDashboardConfig);
router.get("/versions", requireCustomerDashboardPermission("customer_dashboard.read"), listCustomerDashboardVersions);

router.post("/save-draft", requireCustomerDashboardPermission("customer_dashboard.write"), saveCustomerDashboardDraft);
router.post("/publish", requireCustomerDashboardPermission("customer_dashboard.publish"), publishCustomerDashboard);
router.post("/restore-version", requireCustomerDashboardPermission("customer_dashboard.write"), restoreCustomerDashboardVersion);

router.post("/sections", requireCustomerDashboardPermission("customer_dashboard.write"), createCustomerDashboardSection);
router.post("/sections/reorder", requireCustomerDashboardPermission("customer_dashboard.write"), reorderCustomerDashboardSections);
router.patch("/sections/:sectionId", requireCustomerDashboardPermission("customer_dashboard.write"), updateCustomerDashboardSection);
router.delete("/sections/:sectionId", requireCustomerDashboardPermission("customer_dashboard.write"), deleteCustomerDashboardSection);
router.post("/sections/:sectionId/duplicate", requireCustomerDashboardPermission("customer_dashboard.write"), duplicateCustomerDashboardSection);
router.post("/sections/:sectionId/toggle-visibility", requireCustomerDashboardPermission("customer_dashboard.write"), toggleCustomerDashboardSectionVisibility);

router.get("/", requireCustomerDashboardPermission("customer_dashboard.read"), getCustomerDashboard);
router.patch("/", requireCustomerDashboardPermission("customer_dashboard.write"), patchCustomerDashboard);

export default router;
