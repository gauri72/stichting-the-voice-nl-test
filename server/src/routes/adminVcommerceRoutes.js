import { Router } from "express";
import {
  getApplications,
  patchApplication,
  getBusinesses,
  getOneBusiness,
  patchBusiness,
  postSetFeatured,
  patchAdminProduct,
  getOrders,
  getOneOrder,
  getPayouts,
  getPayoutSummary,
  postCreatePayout,
  patchMarkPayoutPaid,
  getAnalytics,
} from "../controllers/adminVcommerceController.js";

const router = Router();

// Applications
router.get("/applications", getApplications);
router.patch("/applications/:id", patchApplication);

// Businesses
router.get("/businesses", getBusinesses);
router.get("/businesses/:id", getOneBusiness);
router.patch("/businesses/:id", patchBusiness);
router.post("/businesses/:id/feature", postSetFeatured);
router.patch("/businesses/:id/products/:productId", patchAdminProduct);

// Orders
router.get("/orders", getOrders);
router.get("/orders/:id", getOneOrder);

// Payouts
router.get("/payouts", getPayouts);
router.get("/businesses/:businessId/payout-summary", getPayoutSummary);
router.post("/payouts", postCreatePayout);
router.patch("/payouts/:id/mark-paid", patchMarkPayoutPaid);

// Analytics
router.get("/analytics", getAnalytics);

export default router;
