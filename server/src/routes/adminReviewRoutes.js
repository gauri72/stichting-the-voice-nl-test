import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listReviewsAdmin,
  getReviewAdmin,
  patchReviewAdmin,
  approveReviewAdmin,
  rejectReviewAdmin,
  hideReviewAdmin,
  featureReviewAdmin,
  deleteReviewAdmin,
} from "../controllers/testimonialController.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listReviewsAdmin);
router.get("/:id", getReviewAdmin);
router.patch("/:id", patchReviewAdmin);
router.post("/:id/approve", approveReviewAdmin);
router.post("/:id/reject", rejectReviewAdmin);
router.post("/:id/hide", hideReviewAdmin);
router.post("/:id/feature", featureReviewAdmin);
router.delete("/:id", deleteReviewAdmin);

export default router;
