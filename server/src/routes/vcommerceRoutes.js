import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getFeatured,
  getList,
  getProfile,
  getApplyStatus,
  postApply,
  postCreateOrder,
  getOrderStatusHandler,
  postReviewHandler,
  getReviewsHandler,
} from "../controllers/vcommerceController.js";

const router = Router();

router.get("/featured", getFeatured);
router.get("/", getList);

// Apply routes — static paths before /:slug
router.get("/apply/status", requireAuth, getApplyStatus);
router.post("/apply", requireAuth, postApply);

// Order status polling (auth required)
router.get("/order/:orderId/status", requireAuth, getOrderStatusHandler);

// Business profile and per-business actions — static before /:slug
router.get("/:slug/reviews", getReviewsHandler);

// Business profile (public)
router.get("/:slug", getProfile);

// Per-business actions (auth required)
router.post("/:businessId/order", requireAuth, postCreateOrder);
router.post("/:businessId/review", requireAuth, postReviewHandler);

export default router;
