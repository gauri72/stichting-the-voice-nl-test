import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  getMemberships,
  getAppleWalletPass,
  getGoogleWalletPass,
  seedMembership,
  getReferrals,
  getAvailableDiscounts,
  getDashboardEvents,
  getDashboardEventTickets,
  getDashboardEventBookingStatus,
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.get("/available-discounts", requireAuth, getAvailableDiscounts);
router.get("/referrals", requireAuth, getReferrals);
router.get("/events", requireAuth, getDashboardEvents);
router.get("/events/:eventId/tickets", requireAuth, getDashboardEventTickets);
router.get("/events/:eventId/booking-status", requireAuth, getDashboardEventBookingStatus);
router.get("/memberships", requireAuth, getMemberships);
router.get("/memberships/wallet/apple", requireAuth, getAppleWalletPass);
router.get("/memberships/wallet/google", requireAuth, getGoogleWalletPass);
router.post("/memberships/seed", requireAuth, seedMembership);

export default router;
