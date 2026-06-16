import { Router } from "express";
import { createTestimonial, listTestimonials } from "../controllers/testimonialController.js";

const router = Router();

router.get("/", listTestimonials);
router.post("/", createTestimonial);

export default router;
