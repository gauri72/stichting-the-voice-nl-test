import { Router } from "express";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";
import { emailOpenPixel, emailClickRedirect, emailUnsubscribe } from "../controllers/emailTrackingController.js";

// Fully public, unauthenticated — recipients hit these directly from their inbox, so there
// is no requireAdmin here (unlike every other route file under server/src/routes/admin*).
const router = Router();

const trackingRateLimit = publicRateLimit({ maxAttempts: 60, windowMs: 60_000, keyPrefix: "email-track" });

router.get("/open/:token.gif", trackingRateLimit, emailOpenPixel);
router.get("/click/:linkToken", trackingRateLimit, emailClickRedirect);
router.get("/unsubscribe/:token", trackingRateLimit, emailUnsubscribe);
router.post("/unsubscribe/:token", trackingRateLimit, emailUnsubscribe);

export default router;
