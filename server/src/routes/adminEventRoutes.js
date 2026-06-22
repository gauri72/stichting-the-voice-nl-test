import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  publishEvent,
  saveDraft,
  deleteEvent,
  patchFeaturedFlags,
  generateFeaturedStyle,
  generateFeaturedImagePrompt,
  listVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  listTickets,
  ticketStats,
  updateTicket,
  checkIn,
  resendEmail,
  downloadTicketPdf,
  exportCsv,
  markCheckedIn,
  markRefunded,
} from "../controllers/ticketAdminController.js";
import { updateEventMembershipSettings } from "../controllers/checkoutBundleController.js";
import {
  getHighlightAdmin,
  listHighlightsAdmin,
  patchHighlightAdmin,
  previewYoutubeAdmin,
  uploadHighlightThumbnailAdmin,
} from "../controllers/eventHighlightController.js";

const router = Router();

router.use(requireAdmin);

router.get("/highlights", listHighlightsAdmin);

router.get("/stats", ticketStats);
router.get("/tickets", listTickets);
router.get("/tickets/export", exportCsv);
router.patch("/tickets/:id", updateTicket);
router.post("/tickets/:id/check-in", markCheckedIn);
router.post("/tickets/:id/refund", markRefunded);
router.post("/tickets/:id/resend-email", resendEmail);
router.get("/tickets/:id/pdf", downloadTicketPdf);
router.post("/check-in", checkIn);

router.get("/vouchers", listVouchers);
router.post("/vouchers", createVoucher);
router.patch("/vouchers/:id", updateVoucher);
router.delete("/vouchers/:id", deleteVoucher);

router.get("/", listEvents);
router.post("/", createEvent);
router.get("/:id", getEvent);
router.get("/:id/highlight", getHighlightAdmin);
router.patch("/:id/highlight", patchHighlightAdmin);
router.post("/:id/highlight/preview-youtube", previewYoutubeAdmin);
router.post("/:id/highlight/upload-thumbnail", uploadHighlightThumbnailAdmin);
router.patch("/:id/featured-flags", patchFeaturedFlags);
router.post("/:id/ai/featured-style", generateFeaturedStyle);
router.post("/:id/ai/featured-image-prompt", generateFeaturedImagePrompt);
router.patch("/:id/membership-discount-settings", updateEventMembershipSettings);
router.put("/:id", updateEvent);
router.post("/:id/publish", publishEvent);
router.post("/:id/draft", saveDraft);
router.delete("/:id", deleteEvent);

export default router;
