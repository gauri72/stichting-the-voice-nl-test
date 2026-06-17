import { verifyTurnstileToken } from "../services/captchaService.js";

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || undefined;
}

export function requireCaptcha() {
  return async function captchaMiddleware(req, res, next) {
    try {
      await verifyTurnstileToken({
        token: req.body?.captchaToken,
        ip: getClientIp(req)
      });
      return next();
    } catch (error) {
      if ((error.status || 500) >= 500) {
        console.error("[captcha]", error);
      }
      return res.status(error.status || 500).json({
        error: error.message || "Security verification failed."
      });
    }
  };
}
