import { Router } from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { createPaymentIntent, confirmPayment } from "../controllers/paymentController.js";

const router = Router();

router.post("/create-payment-intent", optionalAuth, createPaymentIntent);
router.post("/confirm", confirmPayment);

export default router;
