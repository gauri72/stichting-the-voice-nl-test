import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { listPendingAdmin, approveItemAdmin, rejectItemAdmin } from "../controllers/adminI18nReviewController.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listPendingAdmin);
router.post("/:id/approve", approveItemAdmin);
router.post("/:id/reject", rejectItemAdmin);

export default router;
