import { Router } from "express";
import { adminLogin, adminMe, adminDashboard, requireAdmin } from "../controllers/adminController.js";
import { requireCaptcha } from "../middleware/captchaMiddleware.js";
import adminBroadcastRoutes from "./adminBroadcastRoutes.js";
import adminDiscountRoutes from "./adminDiscountRoutes.js";
import adminUserRoutes from "./adminUserRoutes.js";
import adminEventRoutes from "./adminEventRoutes.js";
import adminMembershipRoutes from "./adminMembershipRoutes.js";
import adminSponsorshipRoutes from "./adminSponsorshipRoutes.js";
import adminDonationRoutes from "./adminDonationRoutes.js";
import adminFinanceRoutes from "./adminFinanceRoutes.js";
import adminReportRoutes from "./adminReportRoutes.js";
import { syncTicketTailor } from "../controllers/adminMembershipController.js";

const router = Router();

router.post("/login", requireCaptcha(), adminLogin);
router.get("/me", requireAdmin, adminMe);
router.get("/dashboard", requireAdmin, adminDashboard);
router.use("/broadcasts", adminBroadcastRoutes);
router.use("/discounts", requireAdmin, adminDiscountRoutes);
router.use("/users", requireAdmin, adminUserRoutes);
router.use("/events", adminEventRoutes);
router.post("/tickettailor/sync", requireAdmin, syncTicketTailor);
router.use("/memberships", requireAdmin, adminMembershipRoutes);
router.use("/sponsorships", requireAdmin, adminSponsorshipRoutes);
router.use("/donations", requireAdmin, adminDonationRoutes);
router.use("/finance", requireAdmin, adminFinanceRoutes);
router.use("/reports", requireAdmin, adminReportRoutes);

export default router;
