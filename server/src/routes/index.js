import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import paymentRoutes from "./paymentRoutes.js";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
