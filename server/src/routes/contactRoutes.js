import { Router } from "express";
import {
  submitVentureStudioMessage,
  submitVentureStudioQuote,
  submitVolunteerApplication
} from "../controllers/contactController.js";

const router = Router();

router.post("/venture-studio/message", submitVentureStudioMessage);
router.post("/venture-studio/quote", submitVentureStudioQuote);
router.post("/volunteer", submitVolunteerApplication);

export default router;
