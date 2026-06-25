import { Router } from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { publicRateLimit } from "../middleware/publicRateLimitMiddleware.js";
import {
  resolveBookingFlow,
  startBooking,
  previewBooking,
  checkoutBooking,
  confirmBooking,
  detectMembership,
  resolveCheckoutForms,
  validateCheckoutForms,
  saveBeforeLogin,
  restoreSession,
  applyBenefitsAfterLogin,
  validateDiscountCode,
  validateMembershipCode,
  getMembershipPlans,
  joinWaitlist,
  listWaitlist,
} from "../controllers/bookingController.js";

const router = Router();

router.use(optionalAuth);

router.post("/resolve", resolveBookingFlow);
router.post("/forms/resolve", resolveCheckoutForms);
router.post("/forms/validate", validateCheckoutForms);
router.post("/membership/detect", detectMembership);
router.post("/membership/validate-code", validateMembershipCode);
router.post("/discount/validate-code", validateDiscountCode);
router.post("/session/save-before-login", saveBeforeLogin);
router.post("/session/apply-benefits-after-login", applyBenefitsAfterLogin);
router.get("/session/:sessionId", restoreSession);
router.get("/membership-plans/:eventId", getMembershipPlans);
router.post(
  "/waitlist",
  publicRateLimit({ maxAttempts: 5, windowMs: 60_000, keyPrefix: "waitlist-join" }),
  joinWaitlist
);
// listWaitlist returns full PII (name, email, phone) for everyone on a
// waitlist and isn't called from any of this app's own public UI — restrict
// it to admins rather than leaving it openly readable.
router.get("/waitlist", requireAdmin, listWaitlist);

router.post("/:flowType/start", startBooking);
router.post("/:flowType/preview", previewBooking);
router.post("/:flowType/checkout", checkoutBooking);
router.post("/:flowType/confirm", confirmBooking);

export default router;
