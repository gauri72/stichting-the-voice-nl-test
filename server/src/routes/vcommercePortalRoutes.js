import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getMyBusiness,
  patchMyBusiness,
  uploadBusinessImage,
  getMyProducts,
  postMyProduct,
  patchMyProduct,
  patchMyProductPricing,
  deleteMyProduct,
  postReorderProducts,
  getMyOrders,
  patchMyOrderFulfilled,
  getMyPayouts,
  postImportProducts,
  getProductsTemplate,
  getMyImportHistory,
  getMyReferralLink,
  postConnectOnboarding,
  getConnectStatus,
  getConnectOverview,
  postConnectDashboard,
  patchMyPayoutRegistration,
  postPackageCheckout,
  postSubmitForReview,
} from "../controllers/vcommercePortalController.js";

const IMPORT_FILE_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const extOk = /\.(xlsx|xls|csv)$/i.test(file.originalname || "");
    const typeOk = IMPORT_FILE_MIME_TYPES.has(file.mimetype);
    if (!extOk || !typeOk) {
      const err = new Error("Only .xlsx, .xls, or .csv files are allowed.");
      err.status = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});

const router = Router();

// All portal routes require authentication
router.use(requireAuth);

router.get("/me", getMyBusiness);
router.patch("/me", patchMyBusiness);
router.post("/me/upload/:field", uploadBusinessImage);
router.get("/me/referral-link", getMyReferralLink);
router.get("/me/connect/status", getConnectStatus);
router.get("/me/connect/overview", getConnectOverview);
router.post("/me/connect/onboarding", postConnectOnboarding);
router.post("/me/connect/dashboard", postConnectDashboard);
router.patch("/me/payout-registration", patchMyPayoutRegistration);
router.post("/me/package/checkout", postPackageCheckout);
router.post("/me/submit-review", postSubmitForReview);

// Products — static paths before /:productId
router.get("/me/products/template", getProductsTemplate);
router.post("/me/products/import", upload.single("file"), postImportProducts);
router.get("/me/products/import-history", getMyImportHistory);
router.post("/me/products/reorder", postReorderProducts);
router.get("/me/products", getMyProducts);
router.post("/me/products", postMyProduct);
router.patch("/me/products/:productId", patchMyProduct);
router.patch("/me/products/:productId/pricing", patchMyProductPricing);
router.delete("/me/products/:productId", deleteMyProduct);

router.get("/me/orders", getMyOrders);
router.patch("/me/orders/:orderId/fulfilled", patchMyOrderFulfilled);

router.get("/me/payouts", getMyPayouts);

export default router;
