import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  getMemberships,
  getAppleWalletPass,
  getGoogleWalletPass,
  seedMembership
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.get("/memberships", requireAuth, getMemberships);
router.get("/memberships/wallet/apple", requireAuth, getAppleWalletPass);
router.get("/memberships/wallet/google", requireAuth, getGoogleWalletPass);
router.post("/memberships/seed", requireAuth, seedMembership);

export default router;
