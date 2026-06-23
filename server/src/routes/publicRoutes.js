import { Router } from "express";
import { getPublicSiteConfig, getFeaturedEvents } from "../controllers/publicController.js";
import { getPublicEventHighlights } from "../controllers/eventHighlightController.js";
import {
  getPublicPageContent,
  getPublicHeader,
  getPublicFooter,
  getPreviewPageContent,
} from "../controllers/publicPageController.js";
import sessionPublicRoutes from "./sessionPublicRoutes.js";

const router = Router();

router.get("/site", getPublicSiteConfig);
router.get("/featured-events", getFeaturedEvents);
router.get("/event-highlights", getPublicEventHighlights);
router.get("/pages/:slug", getPublicPageContent);
router.get("/pages/:slug/preview", getPreviewPageContent);
router.get("/site/header", getPublicHeader);
router.get("/site/footer", getPublicFooter);
router.use(sessionPublicRoutes);

export default router;
