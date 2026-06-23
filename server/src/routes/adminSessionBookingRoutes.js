import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminSessionBookings,
  patchAdminSessionBooking,
} from "../controllers/sessionPlatformController.js";

const router = Router();
router.use(requireAdmin);
router.get("/", listAdminSessionBookings);
router.patch("/:id", patchAdminSessionBooking);

export default router;
