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
} from "../controllers/vcommercePortalController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// All portal routes require authentication
router.use(requireAuth);

router.get("/me", getMyBusiness);
router.patch("/me", patchMyBusiness);
router.post("/me/upload/:field", uploadBusinessImage);
router.get("/me/referral-link", getMyReferralLink);

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
