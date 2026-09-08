import { Router } from "express";
import {
  submitVentureStudioMessage,
  submitVentureStudioQuote,
  submitVolunteerApplication
} from "../controllers/contactController.js";
import { requireCaptcha } from "../middleware/captchaMiddleware.js";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";

const router = Router();

// Turnstile alone doesn't catch every bot; this adds a per-IP throttle behind
// it on these captcha-gated forms, same pattern as newsletterRoutes.js.
router.post(
  "/venture-studio/message",
  publicRateLimit({ maxAttempts: 5, windowMs: 60_000, keyPrefix: "contact-venture-message" }),
  requireCaptcha(),
  submitVentureStudioMessage
);
router.post(
  "/venture-studio/quote",
  publicRateLimit({ maxAttempts: 5, windowMs: 60_000, keyPrefix: "contact-venture-quote" }),
  requireCaptcha(),
  submitVentureStudioQuote
);
router.post(
  "/volunteer",
  publicRateLimit({ maxAttempts: 5, windowMs: 60_000, keyPrefix: "contact-volunteer" }),
  requireCaptcha(),
  submitVolunteerApplication
);

export default router;
