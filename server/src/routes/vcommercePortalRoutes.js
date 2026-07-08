import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getMyBusiness,
  patchMyBusiness,
  uploadBusinessImage,
  getMyProducts,
  postMyProduct,
  patchMyProduct,
  deleteMyProduct,
  postReorderProducts,
  getMyOrders,
  patchMyOrderFulfilled,
  getMyPayouts,
} from "../controllers/vcommercePortalController.js";

const router = Router();

// All portal routes require authentication
router.use(requireAuth);

router.get("/me", getMyBusiness);
router.patch("/me", patchMyBusiness);
router.post("/me/upload/:field", uploadBusinessImage);

router.get("/me/products", getMyProducts);
router.post("/me/products", postMyProduct);
router.patch("/me/products/:productId", patchMyProduct);
router.delete("/me/products/:productId", deleteMyProduct);
router.post("/me/products/reorder", postReorderProducts);

router.get("/me/orders", getMyOrders);
router.patch("/me/orders/:orderId/fulfilled", patchMyOrderFulfilled);

router.get("/me/payouts", getMyPayouts);

export default router;
