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

const router = Router();

router.use(requireAdmin);

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
router.put("/:id", updateEvent);
router.post("/:id/publish", publishEvent);
router.post("/:id/draft", saveDraft);
router.delete("/:id", deleteEvent);

export default router;
