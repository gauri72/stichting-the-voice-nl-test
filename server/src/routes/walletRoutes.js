import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/authRateLimitMiddleware.js";
import {
  getWallet,
  getTransactions,
  postTopUp,
  postPay,
  postRedeemPointsPreview,
  putSettings,
  postRevokeAiBooking,
  postConfirmAiBooking,
  getAiBookings,
} from "../controllers/customerWalletController.js";

const router = Router();
router.use(requireAuth);

const walletWriteLimit = authRateLimit({ maxAttempts: 20, windowMs: 15 * 60_000 });

router.get("/", getWallet);
router.get("/transactions", getTransactions);
router.post("/topup", walletWriteLimit, postTopUp);
router.post("/pay", walletWriteLimit, postPay);
router.post("/redeem-points", postRedeemPointsPreview);
router.put("/settings", putSettings);
router.post("/ai-booking/revoke", postRevokeAiBooking);
router.post("/ai-booking/confirm", walletWriteLimit, postConfirmAiBooking);
router.get("/ai-bookings", getAiBookings);

export default router;
