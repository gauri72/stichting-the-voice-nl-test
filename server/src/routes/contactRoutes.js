import { Router } from "express";
import {
  submitVentureStudioMessage,
  submitVentureStudioQuote
} from "../controllers/contactController.js";

const router = Router();

router.post("/venture-studio/message", submitVentureStudioMessage);
router.post("/venture-studio/quote", submitVentureStudioQuote);

export default router;
