import { Router } from "express";
import {
  listPageTemplatesAdmin,
  getPageTemplateAdmin,
  createPageFromTemplateAdmin,
} from "../controllers/adminPageTemplateController.js";
import { requireCmsPermission, requireCmsWrite } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/", requireCmsPermission("pages.read"), listPageTemplatesAdmin);
router.get("/:templateId", requireCmsPermission("pages.read"), getPageTemplateAdmin);
router.post("/create-page", requireCmsWrite, createPageFromTemplateAdmin);

export default router;
