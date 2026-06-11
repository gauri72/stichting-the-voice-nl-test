import { Router } from "express";
import {
  listDiscounts,
  createDiscount,
  deleteDiscount,
  updateDiscount,
  listUsers,
} from "../controllers/adminDiscountController.js";

const router = Router();

router.get("/", listDiscounts);
router.post("/", createDiscount);
router.put("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);
router.get("/users", listUsers);

export default router;
