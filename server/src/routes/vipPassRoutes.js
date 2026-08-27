import { Router } from "express";
import {
  listVipGuests,
  createVipGuest,
  bulkCreateVipGuests,
  resendVipGuestPass,
  voidVipGuestPass,
  getVipPassTheme,
  updateVipPassTheme,
} from "../controllers/vipPassController.js";

const router = Router();

router.get("/", listVipGuests);
router.post("/", createVipGuest);
router.post("/bulk", bulkCreateVipGuests);
router.post("/:ticketId/resend", resendVipGuestPass);
router.post("/:ticketId/void", voidVipGuestPass);
router.get("/theme/:eventId", getVipPassTheme);
router.patch("/theme/:eventId", updateVipPassTheme);

export default router;
