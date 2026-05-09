import { Router } from "express";
import { createPaymentIntent, confirmPayment } from "../controllers/paymentController.js";

const router = Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);

export default router;
