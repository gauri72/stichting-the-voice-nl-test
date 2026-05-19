import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../models/User.js";
import { sendVerificationOtpEmail, sendPasswordResetEmail } from "./authMailer.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token).trim()).digest("hex");
}

function otpMatches(user, otp) {
  if (!user?.verificationOtpHash) return false;
  const submitted = hashOtp(otp);
  const stored = Buffer.from(user.verificationOtpHash, "utf8");
  const candidate = Buffer.from(submitted, "utf8");
  if (stored.length !== candidate.length) return false;
  return crypto.timingSafeEqual(stored, candidate);
}

function signToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? "30d" : "7d";
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.auth.jwtSecret,
    { expiresIn }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.auth.jwtSecret);
}

async function assignOtpToUser(user, firstName) {
  const otp = generateOtp();
  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  const mailResult = await sendVerificationOtpEmail({
    to: user.email,
    firstName: firstName || user.firstName,
    otp
  });

  return {
    otp,
    devOtp: mailResult.devOtp
  };
}

export async function registerUser({ firstName, lastName, email, password }) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing?.isVerified) {
    const err = new Error("An account with this email already exists. Please log in.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  if (existing) {
    existing.firstName = firstName.trim();
    existing.lastName = lastName.trim();
    existing.passwordHash = passwordHash;
    existing.isVerified = false;
    user = existing;
  } else {
    user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      isVerified: false
    });
  }

  const { devOtp } = await assignOtpToUser(user, user.firstName);

  return {
    message: "We sent a 6-digit verification code to your email. Enter it below to activate your account.",
    email: normalizedEmail,
    devOtp: env.nodeEnv === "development" ? devOtp : undefined
  };
}

export async function resendVerificationOtp(email) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const err = new Error("No pending sign-up found for this email. Please create an account first.");
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error("This account is already verified. Please log in.");
    err.status = 409;
    throw err;
  }

  const { devOtp } = await assignOtpToUser(user);

  return {
    message: "A new verification code has been sent to your email.",
    email: normalizedEmail,
    devOtp: env.nodeEnv === "development" ? devOtp : undefined
  };
}

export async function verifyEmailOtp({ email, otp }) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const trimmedOtp = String(otp || "").trim();

  if (!/^\d{6}$/.test(trimmedOtp)) {
    const err = new Error("Please enter a valid 6-digit verification code.");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const err = new Error("No account found for this email. Please sign up first.");
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const authToken = signToken(user, false);
    return {
      message: "Your account is already verified.",
      token: authToken,
      user: user.toSafeJSON()
    };
  }

  if (!user.verificationOtpExpires || user.verificationOtpExpires <= new Date()) {
    const err = new Error("This verification code has expired. Please request a new code.");
    err.status = 400;
    throw err;
  }

  if (!otpMatches(user, trimmedOtp)) {
    const err = new Error("Invalid verification code. Please check and try again.");
    err.status = 400;
    throw err;
  }

  user.isVerified = true;
  user.verificationOtpHash = null;
  user.verificationOtpExpires = null;
  await user.save();

  const authToken = signToken(user, false);

  return {
    message: "Your account has been verified successfully.",
    token: authToken,
    user: user.toSafeJSON()
  };
}

export async function loginUser({ email, password, rememberMe }) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  if (!user.isVerified) {
    const err = new Error(
      "Please verify your email with the 6-digit code we sent you before logging in."
    );
    err.status = 403;
    throw err;
  }

  const authToken = signToken(user, Boolean(rememberMe));

  return {
    token: authToken,
    user: user.toSafeJSON()
  };
}

export async function getUserById(userId) {
  if (!isDbReady()) return null;
  const user = await User.findById(userId);
  if (!user || !user.isVerified) return null;
  return user.toSafeJSON();
}

const PASSWORD_RESET_GENERIC_MESSAGE =
  "If an account exists with this email, you will receive a password reset link shortly.";

export async function requestPasswordReset(email) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = hashResetToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.clientUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;
  const mailResult = await sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    resetUrl
  });

  return {
    message: PASSWORD_RESET_GENERIC_MESSAGE,
    devResetUrl:
      env.nodeEnv === "development" && !mailResult.sent ? mailResult.devResetUrl || resetUrl : undefined
  };
}

export async function resetPassword({ token, password }) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const trimmedToken = String(token || "").trim();
  if (!trimmedToken) {
    const err = new Error("Invalid or expired reset link. Please request a new one.");
    err.status = 400;
    throw err;
  }

  if (!password || password.length < 8) {
    const err = new Error("Password must be at least 8 characters long.");
    err.status = 400;
    throw err;
  }

  const tokenHash = hashResetToken(trimmedToken);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    const err = new Error("Invalid or expired reset link. Please request a new one.");
    err.status = 400;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();

  return {
    message: "Your password has been updated. You can now log in with your new password."
  };
}
