import { Router } from "express";
import { getPublicSiteConfig, getFeaturedEvents } from "../controllers/publicController.js";
import { getPublicEventHighlights } from "../controllers/eventHighlightController.js";

const router = Router();

router.get("/site", getPublicSiteConfig);
router.get("/featured-events", getFeaturedEvents);
router.get("/event-highlights", getPublicEventHighlights);

export default router;
