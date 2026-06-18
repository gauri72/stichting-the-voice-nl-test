import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import {
  listPublishedEvents,
  getPublishedEvent,
  validateVoucher,
  quoteOrder,
  checkout,
  confirmPayment,
  confirmPaymentByIntent,
  getOrder,
  myOrders,
} from "../controllers/ticketController.js";

const router = Router();

router.get("/", listPublishedEvents);
router.get("/orders/my", requireAuth, myOrders);
router.get("/orders/:orderNumber", optionalAuth, getOrder);
router.post("/orders/confirm-intent", optionalAuth, confirmPaymentByIntent);
router.post("/orders/:orderId/confirm", optionalAuth, confirmPayment);

router.get("/:idOrSlug", getPublishedEvent);
router.post("/:eventId/validate-voucher", optionalAuth, validateVoucher);
router.post("/:eventId/quote", optionalAuth, quoteOrder);
router.post("/:eventId/checkout", optionalAuth, checkout);

export default router;
