import { Router } from "express";
import {
  membershipStats,
  listMemberships,
  exportMemberships,
  getMembership,
  createMembership,
  updateMembership,
  deleteMembership,
  renewMembership,
  cancelMembership,
  resendMembershipEmail,
  regenerateMembershipQr,
  downloadMembershipCard,
} from "../controllers/adminMembershipController.js";

const router = Router();

router.get("/stats", membershipStats);
router.get("/export", exportMemberships);
router.get("/", listMemberships);
router.get("/:id/download-card", downloadMembershipCard);
router.get("/:id", getMembership);
router.post("/", createMembership);
router.patch("/:id", updateMembership);
router.delete("/:id", deleteMembership);
router.post("/:id/renew", renewMembership);
router.post("/:id/cancel", cancelMembership);
router.post("/:id/resend-email", resendMembershipEmail);
router.post("/:id/regenerate-qr", regenerateMembershipQr);

export default router;
