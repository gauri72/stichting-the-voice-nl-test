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
} from "../controllers/vcommerceController.js";

const router = Router();

router.get("/featured", getFeatured);
router.get("/", getList);

// Apply routes — /apply/status must be before /:slug to avoid clash
router.get("/apply/status", requireAuth, getApplyStatus);
router.post("/apply", requireAuth, postApply);

// Order status polling (auth required)
router.get("/order/:orderId/status", requireAuth, getOrderStatusHandler);

// Business profile (public) — must be last so static paths above win
router.get("/:slug", getProfile);

// Place an order with a specific business
router.post("/:businessId/order", requireAuth, postCreateOrder);

export default router;
