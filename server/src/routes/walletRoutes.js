import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/authRateLimitMiddleware.js";
import {
  getWallet,
  getTransactions,
  postTopUp,
  postPay,
  postCancelSplitPay,
  postRedeemPointsPreview,
  putSettings,
  postRevokeAiBooking,
  postConfirmAiBooking,
  getAiBookings,
} from "../controllers/customerWalletController.js";

const router = Router();
router.use(requireAuth);

// Every route below is already behind requireAuth, so req.user.id is always
// present — keying by account (not IP+path, the authRateLimit default) means a
// bot driving one compromised account through rotating IPs can't dodge the
// limit, and different customers sharing an IP (office WiFi, carrier NAT) no
// longer compete for the same bucket.
const walletWriteLimit = authRateLimit({
  maxAttempts: 20,
  windowMs: 15 * 60_000,
  keyFn: (req) => (req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}:${req.path}`),
});

router.get("/", getWallet);
router.get("/transactions", getTransactions);
router.post("/topup", walletWriteLimit, postTopUp);
router.post("/pay", walletWriteLimit, postPay);
router.post("/pay/:orderId/cancel", walletWriteLimit, postCancelSplitPay);
router.post("/redeem-points", postRedeemPointsPreview);
router.put("/settings", walletWriteLimit, putSettings);
router.post("/ai-booking/revoke", walletWriteLimit, postRevokeAiBooking);
router.post("/ai-booking/confirm", walletWriteLimit, postConfirmAiBooking);
router.get("/ai-bookings", getAiBookings);

export default router;
