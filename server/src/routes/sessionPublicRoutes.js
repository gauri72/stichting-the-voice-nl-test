import { Router } from "express";
import { optionalAuth } from "../middleware/authMiddleware.js";
import {
  listPublicSessions,
  getPublicSession,
  createPublicSessionBooking,
  confirmPublicSessionBookingPayment,
  getPublicRsvp,
  submitPublicRsvp,
  getSessionBookingPdf,
  getRsvpResponsePdf,
} from "../controllers/sessionPlatformController.js";

const router = Router();

router.get("/sessions", listPublicSessions);
router.get("/sessions/:slug", getPublicSession);
router.post("/session-bookings", optionalAuth, createPublicSessionBooking);
router.post("/session-bookings/confirm-payment", optionalAuth, confirmPublicSessionBookingPayment);
router.get("/session-bookings/:bookingId/pdf", getSessionBookingPdf);

router.get("/rsvp/:slug", getPublicRsvp);
router.post("/rsvp/:slug", submitPublicRsvp);
router.get("/rsvp/:slug/responses/:responseId/pdf", getRsvpResponsePdf);

export default router;
