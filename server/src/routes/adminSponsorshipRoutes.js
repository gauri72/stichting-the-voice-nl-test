import { Router } from "express";
import {
  sponsorshipDashboard,
  listSponsorships,
  getSponsorship,
  createSponsorship,
  updateSponsorship,
  deleteSponsorship,
  sendReminder,
  resendReceipt,
  downloadReceipt,
  downloadInvoice,
  markPaid,
  markOverdue,
  exportSponsorships,
  backfillFromPayments,
} from "../controllers/adminSponsorshipController.js";

const router = Router();

router.get("/dashboard", sponsorshipDashboard);
router.get("/export", exportSponsorships);
router.post("/backfill-payments", backfillFromPayments);
router.get("/", listSponsorships);
router.post("/", createSponsorship);
router.get("/:id/download-receipt", downloadReceipt);
router.get("/:id/download-invoice", downloadInvoice);
router.post("/:id/send-reminder", sendReminder);
router.post("/:id/resend-receipt", resendReceipt);
router.post("/:id/mark-paid", markPaid);
router.post("/:id/mark-overdue", markOverdue);
router.get("/:id", getSponsorship);
router.patch("/:id", updateSponsorship);
router.delete("/:id", deleteSponsorship);

export default router;
