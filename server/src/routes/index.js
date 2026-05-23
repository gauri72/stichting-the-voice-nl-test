import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import paymentRoutes from "./paymentRoutes.js";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import newsletterRoutes from "./newsletterRoutes.js";
import publicRoutes from "./publicRoutes.js";
import contactRoutes from "./contactRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/public", publicRoutes);
router.use("/contact", contactRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
