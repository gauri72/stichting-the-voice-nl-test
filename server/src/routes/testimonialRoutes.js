import { Router } from "express";
import { createTestimonial, listTestimonials } from "../controllers/testimonialController.js";
import { requireCaptcha } from "../middleware/captchaMiddleware.js";

const router = Router();

router.get("/", listTestimonials);
router.post("/", requireCaptcha(), createTestimonial);

export default router;
