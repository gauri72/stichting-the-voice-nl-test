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
  bulkGenerateVouchers,
  exportVouchersCsv,
  listTickets,
  ticketStats,
  updateTicket,
  getTicketDetail,
  transferTicket,
  checkIn,
  resendEmail,
  downloadTicketPdf,
  exportCsv,
  markCheckedIn,
  markRefunded,
  patchTicketType,
  enableTicketTypeSales,
  disableTicketTypeSales,
} from "../controllers/ticketAdminController.js";
import { patchEventCheckoutForm } from "../controllers/checkoutFormController.js";
import { updateEventMembershipSettings } from "../controllers/checkoutBundleController.js";
import {
  getHighlightAdmin,
  listHighlightsAdmin,
  patchHighlightAdmin,
  previewYoutubeAdmin,
  uploadHighlightThumbnailAdmin,
  getHighlightAnalyticsAdmin,
} from "../controllers/eventHighlightController.js";
import {
  getEventShortAdmin,
  previewYoutubeShortAdmin,
  patchEventShortAdmin,
} from "../controllers/eventExperienceAdminController.js";
import {
  getSeatMap,
  patchSeatMap,
  uploadSeatMapImage,
  listSeats,
  createSeat,
  patchSeat,
  deleteSeat,
  bulkCreateSeats,
  repositionSeats,
  blockSeats,
  unblockSeats,
  changeTicketSeat,
  releaseTicketSeat,
} from "../controllers/seatMapAdminController.js";
import adminEventOperationsRoutes from "./adminEventOperationsRoutes.js";

const router = Router();

router.use(requireAdmin);

router.get("/highlights", listHighlightsAdmin);
router.get("/highlights/analytics", getHighlightAnalyticsAdmin);

router.get("/stats", ticketStats);
router.get("/tickets", listTickets);
router.get("/tickets/export", exportCsv);
router.get("/tickets/:id", getTicketDetail);
router.post("/tickets/:ticketId/change-seat", changeTicketSeat);
router.post("/tickets/:ticketId/release-seat", releaseTicketSeat);
router.patch("/tickets/:id", updateTicket);
router.post("/tickets/:id/transfer", transferTicket);
router.post("/tickets/:id/check-in", markCheckedIn);
router.post("/tickets/:id/refund", markRefunded);
router.post("/tickets/:id/resend-email", resendEmail);
router.get("/tickets/:id/pdf", downloadTicketPdf);
router.post("/check-in", checkIn);

router.get("/vouchers", listVouchers);
router.post("/vouchers", createVoucher);
router.post("/vouchers/bulk-generate", bulkGenerateVouchers);
router.get("/vouchers/export.csv", exportVouchersCsv);
router.patch("/vouchers/:id", updateVoucher);
router.delete("/vouchers/:id", deleteVoucher);

router.get("/", listEvents);
router.post("/", createEvent);

router.get("/:eventId/seat-map", getSeatMap);
router.patch("/:eventId/seat-map", patchSeatMap);
router.post("/:eventId/seat-map", patchSeatMap);
router.post("/:eventId/seat-map/upload-image", uploadSeatMapImage);
router.get("/:eventId/seats", listSeats);
router.post("/:eventId/seats", createSeat);
router.patch("/:eventId/seats/:seatId", patchSeat);
router.delete("/:eventId/seats/:seatId", deleteSeat);
router.post("/:eventId/seats/bulk-create", bulkCreateSeats);
router.post("/:eventId/seats/reposition", repositionSeats);
router.post("/:eventId/seats/block", blockSeats);
router.post("/:eventId/seats/unblock", unblockSeats);

router.use("/:eventId", adminEventOperationsRoutes);

router.patch("/:eventId/ticket-types/:ticketTypeId", patchTicketType);
router.post("/:eventId/ticket-types/:ticketTypeId/enable-sales", enableTicketTypeSales);
router.post("/:eventId/ticket-types/:ticketTypeId/disable-sales", disableTicketTypeSales);

router.get("/:id", getEvent);
router.get("/:id/highlight", getHighlightAdmin);
router.patch("/:id/highlight", patchHighlightAdmin);
router.post("/:id/highlight/preview-youtube", previewYoutubeAdmin);
router.post("/:id/highlight/upload-thumbnail", uploadHighlightThumbnailAdmin);
router.get("/:id/short", getEventShortAdmin);
router.post("/:id/short/preview", previewYoutubeShortAdmin);
router.patch("/:id/short", patchEventShortAdmin);
router.patch("/:id/featured-flags", patchFeaturedFlags);
router.post("/:id/ai/featured-style", generateFeaturedStyle);
router.post("/:id/ai/featured-image-prompt", generateFeaturedImagePrompt);
router.patch("/:eventId/checkout-form", patchEventCheckoutForm);
router.patch("/:id/membership-discount-settings", updateEventMembershipSettings);
router.put("/:id", updateEvent);
router.post("/:id/publish", publishEvent);
router.post("/:id/draft", saveDraft);
router.delete("/:id", deleteEvent);

export default router;
