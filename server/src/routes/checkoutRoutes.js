import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import {
  applyDiscount,
  removeDiscount,
  getMemberDiscount,
  validateCode,
} from "../controllers/checkoutDiscountController.js";
import {
  detectMemberStatus,
  calculatePreview,
  applyMembershipBenefit,
  addMembershipToCart,
  removeMembershipFromCart,
  createPaymentSession,
  completeFreeOrderHandler,
  paymentSuccess,
  getMembershipPlansForEvent,
  initCheckoutSession,
  validateMembershipCode,
  saveBeforeLogin,
  getCheckoutSession,
  applyMemberBenefitsAfterLoginHandler,
  applyTicketTailorMembershipBenefitHandler,
} from "../controllers/checkoutBundleController.js";
import {
  holdSeats,
  releaseSeatHold,
  confirmSeats,
} from "../controllers/seatPublicController.js";

const router = Router();

router.post("/apply-discount", optionalAuth, applyDiscount);
router.post("/remove-discount", optionalAuth, removeDiscount);
router.get("/member-discount", requireAuth, getMemberDiscount);
router.post("/validate-code", optionalAuth, validateCode);

router.post("/session", initCheckoutSession);
router.post("/detect-member-status", optionalAuth, detectMemberStatus);
router.post("/validate-membership-code", optionalAuth, validateMembershipCode);
router.post("/save-before-login", optionalAuth, saveBeforeLogin);
router.get("/session/:checkoutSessionId", optionalAuth, getCheckoutSession);
router.post("/apply-member-benefits-after-login", requireAuth, applyMemberBenefitsAfterLoginHandler);
router.post("/apply-tickettailor-membership-benefit", optionalAuth, applyTicketTailorMembershipBenefitHandler);
router.post("/calculate-preview", optionalAuth, calculatePreview);
router.post("/apply-membership-benefit", optionalAuth, applyMembershipBenefit);
router.post("/add-membership-to-cart", optionalAuth, addMembershipToCart);
router.post("/remove-membership-from-cart", optionalAuth, removeMembershipFromCart);
router.post("/create-payment-session", optionalAuth, createPaymentSession);
router.post("/complete-free-order", optionalAuth, completeFreeOrderHandler);
router.post("/seat-hold", optionalAuth, holdSeats);
router.post("/release-seat-hold", optionalAuth, releaseSeatHold);
router.post("/confirm-seats", optionalAuth, confirmSeats);
router.post("/payment-success", optionalAuth, paymentSuccess);
router.get("/membership-plans/:eventId", getMembershipPlansForEvent);

export default router;
