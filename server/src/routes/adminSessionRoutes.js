import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminSessions,
  createAdminSession,
  patchAdminSession,
  listAdminSessionSlots,
  createAdminSessionSlot,
  createAdminRecurringSessionSlots,
  blockAdminSessionDate,
  listAdminSessionBookings,
  patchAdminSessionBooking,
  listAdminResources,
  createAdminResource,
  listAdminRsvpEvents,
  createAdminRsvpEvent,
  listAdminRsvps,
  patchAdminRsvp,
  deleteAdminRsvp,
  getAdminSessionAnalytics,
} from "../controllers/sessionPlatformController.js";

const router = Router();
router.use(requireAdmin);

router.get("/bookings", listAdminSessionBookings);
router.patch("/bookings/:id", patchAdminSessionBooking);
router.get("/analytics", getAdminSessionAnalytics);

router.get("/resources", listAdminResources);
router.post("/resources", createAdminResource);

router.get("/rsvp-events", listAdminRsvpEvents);
router.post("/rsvp-events", createAdminRsvpEvent);
router.get("/rsvps", listAdminRsvps);
router.patch("/rsvps/:slug/:id", patchAdminRsvp);
router.delete("/rsvps/:slug/:id", deleteAdminRsvp);

router.get("/", listAdminSessions);
router.post("/", createAdminSession);
router.patch("/:id", patchAdminSession);
router.get("/:sessionId/slots", listAdminSessionSlots);
router.post("/:sessionId/slots", createAdminSessionSlot);
router.post("/:sessionId/slots/recurring", createAdminRecurringSessionSlots);
router.post("/:sessionId/slots/block-date", blockAdminSessionDate);

export default router;
