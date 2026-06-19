import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";
import {
  applyDiscount,
  removeDiscount,
  getMemberDiscount,
  validateCode,
} from "../controllers/checkoutDiscountController.js";

const router = Router();

router.post("/apply-discount", optionalAuth, applyDiscount);
router.post("/remove-discount", optionalAuth, removeDiscount);
router.get("/member-discount", requireAuth, getMemberDiscount);
router.post("/validate-code", optionalAuth, validateCode);

export default router;
