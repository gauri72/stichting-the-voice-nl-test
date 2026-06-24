import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { issueComplimentary } from "../controllers/bookingController.js";

const router = Router();
router.use(requireAdmin);

router.post("/complimentary", issueComplimentary);

export default router;
