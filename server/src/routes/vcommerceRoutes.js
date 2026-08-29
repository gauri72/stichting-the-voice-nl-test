import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import {
  getFeatured,
  getList,
  getProfile,
  getApplyStatus,
  postApply,
  postCreateOrder,
  getOrderStatusHandler,
  getMyOrdersHandler,
  postReviewHandler,
  getReviewsHandler,
  getStats,
  getPopularProductsHandler,
  confirmApplicationPayment,
  postBusinessInquiry,
} from "../controllers/vcommerceController.js";

const router = Router();

// Static routes first — always before any /:param wildcards
router.get("/featured", getFeatured);
router.get("/stats", getStats);
router.get("/products/popular", getPopularProductsHandler);
router.get("/", getList);

// Apply routes — static paths before /:slug
router.get("/apply/status", requireAuth, getApplyStatus);
router.post("/apply", requireAuth, postApply);
router.get("/apply/payment-confirm", requireAuth, confirmApplicationPayment);

// Order status polling (auth required)
router.get("/order/:orderId/status", optionalAuth, getOrderStatusHandler);

// My orders (buyer's own purchase history — static path before /:slug)
router.get("/my-orders", requireAuth, getMyOrdersHandler);

// Business profile and per-business actions — static before /:slug
router.get("/:slug/reviews", getReviewsHandler);

// Business profile (public)
router.get("/:slug", getProfile);

// Per-business actions (auth required)
router.post("/:businessId/order", optionalAuth, postCreateOrder);
router.post("/:businessId/review", requireAuth, postReviewHandler);
router.post("/:businessId/inquiry", optionalAuth, postBusinessInquiry);

export default router;
