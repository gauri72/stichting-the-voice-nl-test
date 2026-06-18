import { Router } from "express";
import {
  verifyTicket,
  ticketQrImage,
  downloadPublicTicketPdf,
} from "../controllers/ticketController.js";

const router = Router();

router.get("/verify/:token", verifyTicket);
router.get("/qr/:token", ticketQrImage);
router.get("/:ticketNumber/pdf", downloadPublicTicketPdf);

export default router;
