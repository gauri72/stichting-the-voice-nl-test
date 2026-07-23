import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import {
  listPublishedEvents,
  getPublishedEvent,
  quoteOrder,
  checkout,
  confirmPayment,
  confirmPaymentByIntent,
  getOrder,
  myOrders,
} from "../controllers/ticketController.js";
import { getPublicSeatMap } from "../controllers/seatPublicController.js";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";

const router = Router();

router.get("/", listPublishedEvents);
router.get("/orders/my", requireAuth, myOrders);
router.get(
  "/orders/:orderNumber",
  publicRateLimit({ maxAttempts: 10, windowMs: 5 * 60_000, keyPrefix: "guest-order-lookup" }),
  optionalAuth,
  getOrder
);
router.post("/orders/confirm-intent", optionalAuth, confirmPaymentByIntent);
router.post("/orders/:orderId/confirm", optionalAuth, confirmPayment);

router.get("/:eventId/seat-map", getPublicSeatMap);
router.get("/:eventId/seats/availability", getPublicSeatMap);

router.get("/:idOrSlug", getPublishedEvent);
router.post("/:eventId/quote", optionalAuth, quoteOrder);
router.post("/:eventId/checkout", optionalAuth, checkout);

export default router;
