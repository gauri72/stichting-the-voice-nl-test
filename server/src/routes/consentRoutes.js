import { Router } from "express";
import { getConsentByUserId, saveConsent } from "../controllers/consentController.js";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", optionalAuth, saveConsent);
router.get("/:userId", requireAuth, getConsentByUserId);

export default router;
