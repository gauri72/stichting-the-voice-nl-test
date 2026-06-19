import { Router } from "express";
import {
  donationDashboard,
  listDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
  sendReminder,
  resendReceipt,
  downloadReceipt,
  markPaid,
  markRefunded,
  exportDonations,
} from "../controllers/adminDonationController.js";

const router = Router();

router.get("/dashboard", donationDashboard);
router.get("/export", exportDonations);
router.get("/", listDonations);
router.post("/", createDonation);
router.get("/:id/download-receipt", downloadReceipt);
router.post("/:id/send-reminder", sendReminder);
router.post("/:id/resend-receipt", resendReceipt);
router.post("/:id/mark-paid", markPaid);
router.post("/:id/mark-refunded", markRefunded);
router.get("/:id", getDonation);
router.patch("/:id", updateDonation);
router.delete("/:id", deleteDonation);

export default router;
