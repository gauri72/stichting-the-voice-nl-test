import { Router } from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleAuth,
  me,
  forgotPassword,
  resetPasswordHandler,
  requireAuth
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordHandler);
router.get("/me", requireAuth, me);

export default router;
