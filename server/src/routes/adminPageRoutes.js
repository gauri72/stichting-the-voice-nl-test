import { Router } from "express";
import {
  listPagesAdmin,
  getPageAdmin,
  createPageAdmin,
  updatePageAdmin,
  deletePageAdmin,
  archivePageAdmin,
  restorePageAdmin,
  saveDraftAdmin,
  publishPageAdmin,
  duplicatePageAdmin,
  addSectionAdmin,
  addLinkedSectionAdmin,
  updateSectionAdmin,
  deleteSectionAdmin,
  reorderSectionsAdmin,
  duplicateSectionAdmin,
  toggleSectionVisibilityAdmin,
  restoreVersionAdmin,
  listVersionsAdmin,
  compareVersionsAdmin,
  uploadPageImageAdmin,
  getHeaderAdmin,
  updateHeaderAdmin,
  getFooterAdmin,
  updateFooterAdmin,
  getCmsConfig,
  getCmsAuditLogAdmin,
} from "../controllers/adminPageController.js";
import {
  requireCmsPermission,
  requireCmsWrite,
  requireCmsPublish,
} from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/config", requireCmsPermission("pages.read"), getCmsConfig);
router.get("/cms-audit-log", requireCmsPermission("pages.read"), getCmsAuditLogAdmin);
router.get("/", requireCmsPermission("pages.read"), listPagesAdmin);
router.post("/", requireCmsWrite, createPageAdmin);

router.get("/site/header", requireCmsPermission("pages.read"), getHeaderAdmin);
router.patch("/site/header", requireCmsPermission("header.write"), updateHeaderAdmin);
router.get("/site/footer", requireCmsPermission("pages.read"), getFooterAdmin);
router.patch("/site/footer", requireCmsPermission("footer.write"), updateFooterAdmin);

router.post("/uploads/page-image", requireCmsPermission("upload"), uploadPageImageAdmin);

router.get("/:slug/versions", requireCmsPermission("pages.read"), listVersionsAdmin);
router.get("/:slug/versions/compare", requireCmsPermission("pages.read"), compareVersionsAdmin);
router.post("/:slug/save-draft", requireCmsWrite, saveDraftAdmin);
router.post("/:slug/publish", requireCmsPublish, publishPageAdmin);
router.post("/:slug/restore-version", requireCmsWrite, restoreVersionAdmin);
router.post("/:slug/duplicate", requireCmsWrite, duplicatePageAdmin);
router.post("/:slug/archive", requireCmsWrite, archivePageAdmin);
router.post("/:slug/restore", requireCmsWrite, restorePageAdmin);

router.post("/:slug/sections", requireCmsWrite, addSectionAdmin);
router.post("/:slug/sections/from-library", requireCmsWrite, addLinkedSectionAdmin);
router.post("/:slug/sections/reorder", requireCmsWrite, reorderSectionsAdmin);
router.patch("/:slug/sections/:sectionId", requireCmsWrite, updateSectionAdmin);
router.delete("/:slug/sections/:sectionId", requireCmsWrite, deleteSectionAdmin);
router.post("/:slug/sections/:sectionId/duplicate", requireCmsWrite, duplicateSectionAdmin);
router.post("/:slug/sections/:sectionId/toggle-visibility", requireCmsWrite, toggleSectionVisibilityAdmin);

router.get("/:slug", requireCmsPermission("pages.read"), getPageAdmin);
router.patch("/:slug", requireCmsWrite, updatePageAdmin);
router.delete("/:slug", requireCmsWrite, deletePageAdmin);

export default router;
