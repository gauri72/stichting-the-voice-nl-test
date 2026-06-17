import { Router } from "express";
import {
  submitVentureStudioMessage,
  submitVentureStudioQuote,
  submitVolunteerApplication
} from "../controllers/contactController.js";
import { requireCaptcha } from "../middleware/captchaMiddleware.js";

const router = Router();

router.post("/venture-studio/message", requireCaptcha(), submitVentureStudioMessage);
router.post("/venture-studio/quote", requireCaptcha(), submitVentureStudioQuote);
router.post("/volunteer", requireCaptcha(), submitVolunteerApplication);

export default router;
