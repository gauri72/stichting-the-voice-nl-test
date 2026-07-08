import { Router } from "express";
import {
  getFeaturedEventsHandler,
  getUpcomingEventsHandler,
  getEventShortsHandler,
  getCalendarHandler,
} from "../controllers/eventExperienceController.js";
import {
  getSavedEventIds,
  postSaveEvent,
  deleteSaveEvent,
  postBulkSaveEvents,
} from "../controllers/savedEventController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

// Routes for the new, standalone /event-experience page. Mounted at
// /api/event-experience — deliberately NOT under /api/events, since
// eventRoutes.js already registers GET /:idOrSlug there, which would
// otherwise greedily match these path segments.
const router = Router();

router.get("/featured", getFeaturedEventsHandler);
router.get("/upcoming", getUpcomingEventsHandler);
router.get("/shorts", getEventShortsHandler);
router.get("/calendar", getCalendarHandler);

// Saved events — logged-in customers only (guests save via localStorage
// client-side only, see useSavedEvents.js).
router.get("/saved", requireAuth, getSavedEventIds);
router.post("/saved/bulk", requireAuth, postBulkSaveEvents);
router.post("/saved/:eventId", requireAuth, postSaveEvent);
router.delete("/saved/:eventId", requireAuth, deleteSaveEvent);

export default router;
