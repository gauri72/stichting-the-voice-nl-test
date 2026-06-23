import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminCheckoutForms,
  createAdminCheckoutForm,
  getAdminCheckoutForm,
  patchAdminCheckoutForm,
  deleteAdminCheckoutForm,
  listAdminCheckoutFormResponses,
} from "../controllers/checkoutFormController.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listAdminCheckoutForms);
router.post("/", createAdminCheckoutForm);
router.get("/responses", listAdminCheckoutFormResponses);
router.get("/:id", getAdminCheckoutForm);
router.patch("/:id", patchAdminCheckoutForm);
router.delete("/:id", deleteAdminCheckoutForm);

export default router;
