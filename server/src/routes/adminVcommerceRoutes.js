import { Router } from "express";
import {
  getApplications,
  patchApplication,
  getBusinesses,
  getOneBusiness,
  patchBusiness,
  postSetFeatured,
  postUnsetFeatured,
  patchAdminProduct,
  getOrders,
  getOneOrder,
  downloadOrderReceipt,
  resendOrderReceipt,
  patchOrderStatus,
  getPayouts,
  getPayoutSummary,
  postCreatePayout,
  patchMarkPayoutPaid,
  getAnalytics,
  postAdminProduct,
  deleteAdminProductController,
  getBusinessActivity,
  getChargeRules,
  postChargeRule,
  patchChargeRule,
  getAdjustments,
  postAdjustment,
  getLedger,
  patchOrderPayoutHold,
  getRiskFlags,
  postRiskFlag,
  patchRiskFlag,
  getOperations,
  postRiskScan,
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
router.post("/businesses/:id/featured", postSetFeatured);
router.post("/businesses/:id/unfeature", postUnsetFeatured);
router.get("/businesses/:id/activity", getBusinessActivity);
router.post("/businesses/:id/products", postAdminProduct);
router.patch("/businesses/:id/products/:productId", patchAdminProduct);
router.delete("/businesses/:id/products/:productId", deleteAdminProductController);

// Orders
router.get("/orders", getOrders);
router.get("/orders/:id", getOneOrder);
router.get("/orders/:id/receipt", downloadOrderReceipt);
router.post("/orders/:id/resend-receipt", resendOrderReceipt);
router.patch("/orders/:id/status", patchOrderStatus);
router.patch("/orders/:id/payout-hold", patchOrderPayoutHold);

// Payouts
router.get("/payouts", getPayouts);
router.get("/businesses/:businessId/payout-summary", getPayoutSummary);
router.post("/payouts", postCreatePayout);
router.patch("/payouts/:id/mark-paid", patchMarkPayoutPaid);

// Analytics
router.get("/analytics", getAnalytics);

// Commercial controls and immutable finance operations
router.get("/charge-rules", getChargeRules);
router.post("/charge-rules", postChargeRule);
router.patch("/charge-rules/:id", patchChargeRule);
router.get("/adjustments", getAdjustments);
router.post("/adjustments", postAdjustment);
router.get("/ledger", getLedger);

// Risk, automation and operations
router.get("/risk-flags", getRiskFlags);
router.post("/risk-flags", postRiskFlag);
router.patch("/risk-flags/:id", patchRiskFlag);
router.get("/operations", getOperations);
router.post("/operations/risk-scan", postRiskScan);

export default router;
