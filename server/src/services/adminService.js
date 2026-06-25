import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import Admin from "../models/Admin.js";
import { writeAccessAudit } from "./accessManagementService.js";
import { ACCESS_AUDIT_ACTIONS } from "../config/rbacConfig.js";
import { getAdminAccessProfile } from "./rbacService.js";

const BCRYPT_ROUNDS = 12;

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function signAdminToken(admin, rememberMe = false) {
  const expiresIn = rememberMe ? "30d" : "7d";
  return jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      type: "admin",
      role: admin.role,
    },
    env.auth.jwtSecret,
    { expiresIn }
  );
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, env.auth.jwtSecret);
  if (payload.type !== "admin") {
    const err = new Error("Invalid admin session.");
    err.status = 401;
    throw err;
  }
  return payload;
}

export async function getAdminById(id) {
  if (!id || !mongoose.isValidObjectId(id)) return null;
  return getAdminAccessProfile(id);
}

export async function loginAdmin({ email, password, rememberMe }, req = null) {
  if (!isDbReady()) {
    const err = new Error("Database is not available. Please try again later.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const admin = await Admin.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!admin || !admin.isActive || ["disabled", "suspended"].includes(admin.status)) {
    await writeAccessAudit({
      adminId: admin?._id,
      action: ACCESS_AUDIT_ACTIONS.LOGIN_FAILED,
      targetType: "admin_user",
      targetId: admin?._id || "",
      summary: `Failed login for ${normalizedEmail}`,
      req,
    });
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  if (admin.status === "invited" || !admin.passwordHash) {
    const err = new Error("Please accept your invitation and set a password first.");
    err.status = 403;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    await writeAccessAudit({
      adminId: admin._id,
      action: ACCESS_AUDIT_ACTIONS.LOGIN_FAILED,
      targetType: "admin_user",
      targetId: admin._id,
      summary: `Failed login for ${normalizedEmail}`,
      req,
    });
    const err = new Error("Invalid email or password.");
    err.status = 401;
    throw err;
  }

  admin.lastLoginAt = new Date();
  if (admin.status === "invited") admin.status = "active";
  await admin.save();

  await writeAccessAudit({
    adminId: admin._id,
    action: ACCESS_AUDIT_ACTIONS.LOGIN_SUCCESS,
    targetType: "admin_user",
    targetId: admin._id,
    summary: `Login success for ${normalizedEmail}`,
    req,
  });

  const token = signAdminToken(admin, Boolean(rememberMe));
  const profile = await getAdminAccessProfile(admin._id);

  return {
    token,
    admin: profile,
    message: "Welcome back!",
  };
}

export async function createAdminAccount({
  firstName,
  lastName,
  email,
  password,
  role = "admin",
}) {
  if (!isDbReady()) {
    const err = new Error("Database is not available.");
    err.status = 503;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error("An admin with this email already exists.");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const admin = await Admin.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    isActive: true,
  });

  return admin.toSafeJSON();
}
