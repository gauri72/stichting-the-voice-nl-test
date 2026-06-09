import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getPaymentMethods,
  postSetupIntent,
  postConfirmSetup,
  putDefaultPaymentMethod,
  removePaymentMethod
} from "../controllers/paymentMethodController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getPaymentMethods);
router.post("/setup-intent", postSetupIntent);
router.post("/confirm-setup", postConfirmSetup);
router.put("/:id/default", putDefaultPaymentMethod);
router.delete("/:id", removePaymentMethod);

export default router;
