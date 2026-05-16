import {
  registerUser,
  verifyEmailOtp,
  resendVerificationOtp,
  loginUser,
  getUserById
} from "../services/authService.js";
import { requireAuth } from "../middleware/authMiddleware.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[auth]", error);
  }
  return res.status(status).json({ error: message });
}

export async function register(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const result = await registerUser({ firstName, lastName, email, password });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};

    if (!email?.trim() || !otp) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const result = await verifyEmailOtp({ email, otp });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    const result = await resendVerificationOtp(email);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await loginUser({ email, password, rememberMe });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

export { requireAuth };
