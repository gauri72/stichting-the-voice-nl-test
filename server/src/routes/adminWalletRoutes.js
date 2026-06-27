import { Router } from "express";
import {
  getWallets,
  getTransactions,
  postCredit,
  postDebit,
  postPointsAdjust,
  getSettings,
  patchSettings,
  getAiBookings,
  getAnalytics,
  postRefund,
} from "../controllers/adminWalletController.js";

const router = Router();

router.get("/wallets", getWallets);
router.get("/transactions", getTransactions);
router.post("/credit", postCredit);
router.post("/debit", postDebit);
router.post("/points-adjust", postPointsAdjust);
router.get("/settings", getSettings);
router.patch("/settings", patchSettings);
router.get("/ai-bookings", getAiBookings);
router.get("/analytics", getAnalytics);
router.post("/refund", postRefund);

export default router;
