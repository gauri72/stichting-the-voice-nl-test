import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminRsvps,
  patchAdminRsvp,
  deleteAdminRsvp,
  listAdminRsvpEvents,
  createAdminRsvpEvent,
} from "../controllers/sessionPlatformController.js";

const router = Router();
router.use(requireAdmin);
router.get("/", listAdminRsvps);
router.patch("/:slug/:id", patchAdminRsvp);
router.delete("/:slug/:id", deleteAdminRsvp);
router.get("/events", listAdminRsvpEvents);
router.post("/events", createAdminRsvpEvent);

export default router;
