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
import { authRateLimit } from "../middleware/authRateLimitMiddleware.js";

const router = Router();
const limit = authRateLimit();

router.post("/register", limit, requireCaptcha(), register);
router.post("/verify-otp", limit, requireCaptcha(), verifyOtp);
router.post("/resend-otp", limit, requireCaptcha(), resendOtp);
router.post("/login", limit, requireCaptcha(), login);
router.post("/google", limit, requireCaptcha(), googleAuth);
router.post("/forgot-password", limit, requireCaptcha(), forgotPassword);
router.post("/reset-password", limit, requireCaptcha(), resetPasswordHandler);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);
router.patch("/password", requireAuth, changePasswordHandler);

export default router;
