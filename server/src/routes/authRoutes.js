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
  updateProfile,
  changePasswordHandler,
  requireAuth
} from "../controllers/authController.js";
import { requireCaptcha } from "../middleware/captchaMiddleware.js";

const router = Router();

router.post("/register", requireCaptcha(), register);
router.post("/verify-otp", requireCaptcha(), verifyOtp);
router.post("/resend-otp", requireCaptcha(), resendOtp);
router.post("/login", requireCaptcha(), login);
router.post("/google", requireCaptcha(), googleAuth);
router.post("/forgot-password", requireCaptcha(), forgotPassword);
router.post("/reset-password", requireCaptcha(), resetPasswordHandler);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);
router.patch("/password", requireAuth, changePasswordHandler);

export default router;
