import { Router } from "express";
import { translateCmsTextHandler } from "../controllers/cmsTextController.js";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";

const router = Router();

router.post(
  "/translate",
  publicRateLimit({ maxAttempts: 40, windowMs: 60_000, keyPrefix: "cms-text-translate" }),
  translateCmsTextHandler
);

export default router;
