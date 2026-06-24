import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listAdminCheckoutForms,
  listAdminStandardCheckoutForms,
  createAdminCheckoutForm,
  getAdminCheckoutForm,
  patchAdminCheckoutForm,
  deleteAdminCheckoutForm,
  publishAdminCheckoutForm,
  duplicateAdminCheckoutForm,
  restoreDefaultAdminCheckoutForm,
  archiveAdminCheckoutForm,
  applyAdminCheckoutFormToEvents,
  listAdminCheckoutFormResponses,
} from "../controllers/checkoutFormController.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listAdminCheckoutForms);
router.get("/standard", listAdminStandardCheckoutForms);
router.post("/", createAdminCheckoutForm);
router.get("/responses", listAdminCheckoutFormResponses);
router.get("/:id", getAdminCheckoutForm);
router.patch("/:id", patchAdminCheckoutForm);
router.delete("/:id", deleteAdminCheckoutForm);
router.post("/:id/publish", publishAdminCheckoutForm);
router.post("/:id/duplicate", duplicateAdminCheckoutForm);
router.post("/:id/restore-default", restoreDefaultAdminCheckoutForm);
router.post("/:id/archive", archiveAdminCheckoutForm);
router.post("/:id/apply-to-events", applyAdminCheckoutFormToEvents);

export default router;
