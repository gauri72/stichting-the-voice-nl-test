import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import paymentRoutes from "./paymentRoutes.js";
import authRoutes from "./authRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);

export default router;
