import { Router } from "express";
import {
  listComponentRegistryAdmin,
  refreshComponentRegistryAdmin,
} from "../controllers/adminComponentRegistryController.js";
import { requireCmsPermission, requireCmsWrite } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/", requireCmsPermission("pages.read"), listComponentRegistryAdmin);
router.post("/refresh", requireCmsWrite, refreshComponentRegistryAdmin);

export default router;
