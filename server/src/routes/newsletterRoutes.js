import { Router } from "express";
import { subscribeNewsletter } from "../controllers/newsletterController.js";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";

const router = Router();

router.post(
  "/subscribe",
  publicRateLimit({ maxAttempts: 5, windowMs: 60_000, keyPrefix: "newsletter" }),
  subscribeNewsletter
);

export default router;
