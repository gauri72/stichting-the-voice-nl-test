import { Router } from "express";
import {
  getDesignSystemAdmin,
  updateDesignSystemAdmin,
  publishDesignSystemAdmin,
} from "../controllers/adminDesignSystemController.js";
import { requireCmsPermission, requireCmsWrite, requireCmsPublish } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/", requireCmsPermission("pages.read"), getDesignSystemAdmin);
router.put("/", requireCmsWrite, updateDesignSystemAdmin);
router.post("/publish", requireCmsPublish, publishDesignSystemAdmin);

export default router;
