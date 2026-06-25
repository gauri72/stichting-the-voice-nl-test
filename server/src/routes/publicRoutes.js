import { Router } from "express";
import { getPublicSiteConfig, getFeaturedEvents } from "../controllers/publicController.js";
import { getPublicEventHighlights, trackPublicHighlightMetric } from "../controllers/eventHighlightController.js";
import {
  getPublicPageContent,
  getPublicHeader,
  getPublicFooter,
  getPublicDesignSystem,
  getPublicContentOverrides,
  getPreviewPageContent,
} from "../controllers/publicPageController.js";
import sessionPublicRoutes from "./sessionPublicRoutes.js";
import { listTestimonials } from "../controllers/testimonialController.js";
import { listTeamMembersPublic } from "../controllers/teamMemberController.js";

const router = Router();

router.get("/site", getPublicSiteConfig);
router.get("/featured-events", getFeaturedEvents);
router.get("/event-highlights", getPublicEventHighlights);
router.get("/reviews", listTestimonials);
router.get("/team-members", listTeamMembersPublic);
router.post("/event-highlights/track", trackPublicHighlightMetric);
router.get("/pages/:slug", getPublicPageContent);
router.get("/pages/:slug/preview", getPreviewPageContent);
router.get("/site/header", getPublicHeader);
router.get("/site/footer", getPublicFooter);
router.get("/site/design-system", getPublicDesignSystem);
router.get("/content-overrides", getPublicContentOverrides);
router.use(sessionPublicRoutes);

export default router;
