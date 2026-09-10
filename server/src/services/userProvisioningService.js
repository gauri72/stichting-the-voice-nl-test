import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { issueAccountClaimToken } from "./authService.js";
import { sendAccountClaimEmail } from "./authMailer.js";
import env from "../config/env.js";

const BCRYPT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** Splits a single free-text name into { firstName, lastName } the same way
 *  vipPassService.js's splitGuestName does — a single-word name must not
 *  produce an empty lastName (User.lastName is required). */
export function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "Guest", lastName: parts.slice(1).join(" ") || "-" };
}

/** Auto-provisions a User account for `email` if one doesn't already exist,
 *  and sends a one-time branded "create your account" email. Called from
 *  every real product/service flow (ticket purchase, donation, sponsorship,
 *  volunteer application, Venture Studio inquiry, V.Commerce purchase) at
 *  the moment it successfully completes — never for admin-issued/comp
 *  tickets or admin-created users, and never for memberships (which already
 *  require an existing account).
 *
 *  Safe to call unconditionally and repeatedly for the same email: existing
 *  users are a no-op (no duplicate account, no repeat email), and a
 *  duplicate-key race between two concurrent flows for the same brand-new
 *  email is caught and resolved to the winning document. Never throws back
 *  into the calling checkout/submission flow — provisioning/email failures
 *  are logged and swallowed so they can't block a real transaction. */
export async function ensureUserForEmail(email, { firstName = "", lastName = "", phone = "" } = {}, source) {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return { user: null, created: false };

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return { user: existing, created: false };

    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS);

    let user;
    try {
      user = await User.create({
        firstName: String(firstName || "").trim() || "Guest",
        lastName: String(lastName || "").trim() || "-",
        email: normalizedEmail,
        phone: String(phone || "").trim(),
        passwordHash,
        isVerified: false,
        isAutoProvisioned: true
      });
    } catch (error) {
      if (error?.code === 11000) {
        const raceWinner = await User.findOne({ email: normalizedEmail });
        if (raceWinner) return { user: raceWinner, created: false };
      }
      throw error;
    }

    try {
      const token = await issueAccountClaimToken(user._id);
      const claimUrl = `${env.clientUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
      await sendAccountClaimEmail({ to: user.email, firstName: user.firstName, source, claimUrl });
    } catch (error) {
      console.warn("[user-provisioning] Could not send account claim email:", error.message);
    }

    return { user, created: true };
  } catch (error) {
    console.warn("[user-provisioning] ensureUserForEmail failed:", error.message);
    return { user: null, created: false };
  }
}
