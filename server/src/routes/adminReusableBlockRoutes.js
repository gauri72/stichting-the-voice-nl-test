import { Router } from "express";
import {
  listReusableBlocksAdmin,
  getReusableBlockAdmin,
  createReusableBlockAdmin,
  updateReusableBlockAdmin,
  deleteReusableBlockAdmin,
} from "../controllers/adminReusableBlockController.js";
import { requireCmsPermission, requireCmsWrite, requireCmsPublish } from "../middleware/cmsMiddleware.js";

const router = Router();

router.get("/", requireCmsPermission("pages.read"), listReusableBlocksAdmin);
router.post("/", requireCmsWrite, createReusableBlockAdmin);
router.get("/:blockId", requireCmsPermission("pages.read"), getReusableBlockAdmin);
router.patch("/:blockId", requireCmsWrite, updateReusableBlockAdmin);
router.post("/:blockId/publish", requireCmsPublish, (req, res, next) => {
  req.body = { ...req.body, publish: true };
  next();
}, updateReusableBlockAdmin);
router.delete("/:blockId", requireCmsWrite, deleteReusableBlockAdmin);

export default router;
