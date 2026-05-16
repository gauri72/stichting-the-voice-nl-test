import { Router } from "express";
import { register, verifyOtp, resendOtp, login, me, requireAuth } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
