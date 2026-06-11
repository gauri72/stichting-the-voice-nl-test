import { Router } from "express";
import { adminLogin, adminMe, adminDashboard, requireAdmin } from "../controllers/adminController.js";
import adminBroadcastRoutes from "./adminBroadcastRoutes.js";
import adminDiscountRoutes from "./adminDiscountRoutes.js";

const router = Router();

router.post("/login", adminLogin);
router.get("/me", requireAdmin, adminMe);
router.get("/dashboard", requireAdmin, adminDashboard);
router.use("/broadcasts", adminBroadcastRoutes);
router.use("/discounts", requireAdmin, adminDiscountRoutes);

export default router;
