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
  getDashboardGiving,
  getDashboardEventTickets,
  getDashboardEventBookingStatus,
  getDashboardSessions,
  getDashboardRsvps,
} from "../controllers/dashboardController.js";
import {
  getDashboardConfig,
  getDashboardData,
} from "../controllers/customerDashboardController.js";

const router = Router();

router.get("/config", requireAuth, getDashboardConfig);
router.get("/data", requireAuth, getDashboardData);

router.get("/", requireAuth, getDashboard);
router.get("/available-discounts", requireAuth, getAvailableDiscounts);
router.get("/referrals", requireAuth, getReferrals);
router.get("/events", requireAuth, getDashboardEvents);
router.get("/giving", requireAuth, getDashboardGiving);
router.get("/events/:eventId/tickets", requireAuth, getDashboardEventTickets);
router.get("/events/:eventId/booking-status", requireAuth, getDashboardEventBookingStatus);
router.get("/sessions", requireAuth, getDashboardSessions);
router.get("/rsvps", requireAuth, getDashboardRsvps);
router.get("/memberships", requireAuth, getMemberships);
router.get("/memberships/wallet/apple", requireAuth, getAppleWalletPass);
router.get("/memberships/wallet/google", requireAuth, getGoogleWalletPass);
router.post("/memberships/seed", requireAuth, seedMembership);

export default router;
