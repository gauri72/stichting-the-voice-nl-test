import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import paymentRoutes from "./paymentRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/payments", paymentRoutes);

export default router;
