import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getCustomerDiscounts } from "../controllers/discountController.js";

const router = Router();

router.get("/", requireAuth, getCustomerDiscounts);

export default router;
