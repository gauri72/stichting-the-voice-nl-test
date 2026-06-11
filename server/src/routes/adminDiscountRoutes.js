import { Router } from "express";
import {
  listDiscounts,
  createDiscount,
  deleteDiscount,
  listUsers,
} from "../controllers/adminDiscountController.js";

const router = Router();

router.get("/", listDiscounts);
router.post("/", createDiscount);
router.delete("/:id", deleteDiscount);
router.get("/users", listUsers);

export default router;
