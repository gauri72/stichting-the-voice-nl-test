import { Router } from "express";
import {
  listMediaAssetsAdmin,
  uploadMediaAssetAdmin,
  getMediaAssetUsageAdmin,
  archiveMediaAssetAdmin,
  deleteMediaAssetAdmin,
} from "../controllers/adminMediaLibraryController.js";
import { requireCmsPermission, requireCmsWrite } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/", requireCmsPermission("pages.read"), listMediaAssetsAdmin);
router.post("/", requireCmsPermission("upload"), uploadMediaAssetAdmin);
router.get("/:assetId/usage", requireCmsPermission("pages.read"), getMediaAssetUsageAdmin);
router.post("/:assetId/archive", requireCmsWrite, archiveMediaAssetAdmin);
router.delete("/:assetId", requireCmsWrite, deleteMediaAssetAdmin);

export default router;
