import { Router } from "express";
import {
  getDashboard,
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  pauseDiscount,
  activateDiscount,
  duplicateDiscount,
  getUsage,
  exportUsage,
  syncDiscounts,
  listUsers,
  listEvents,
  listLegacyDiscounts,
  createLegacyDiscount,
  listReferrals,
  approveReferral,
  markReferralPaid,
  cancelReferral,
} from "../controllers/adminDiscountController.js";

const router = Router();

router.get("/dashboard", getDashboard);
router.get("/export", exportUsage);
router.post("/sync", syncDiscounts);
router.get("/users", listUsers);
router.get("/events", listEvents);

router.get("/referrals", listReferrals);
router.patch("/referrals/:id/approve", approveReferral);
router.patch("/referrals/:id/mark-paid", markReferralPaid);
router.patch("/referrals/:id/cancel", cancelReferral);

router.get("/legacy", listLegacyDiscounts);
router.post("/legacy", createLegacyDiscount);

router.get("/", listDiscounts);
router.post("/", createDiscount);
router.get("/:id", getDiscount);
router.patch("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);
router.post("/:id/pause", pauseDiscount);
router.post("/:id/activate", activateDiscount);
router.post("/:id/duplicate", duplicateDiscount);
router.get("/:id/usage", getUsage);

export default router;
