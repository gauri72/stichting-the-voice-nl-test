import crypto from "crypto";
import env from "../config/env.js";

/** Opaque, unguessable token for public email-tracking URLs (open pixel, click redirect,
 * unsubscribe link) — never derived from an email address or user/recipient ID, so the
 * public endpoints that look these up can't be enumerated or used to infer PII. */
export function generateTrackingToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Salted SHA-256 hash of an IP address — used instead of storing raw IPs on tracking
 * events, per the GDPR-minimization requirement. Reuses the app's existing JWT secret as
 * the salt rather than introducing a new env var — this hash only needs to be
 * non-reversible, not cryptographically independent from other secrets. */
export function hashIp(ip) {
  if (!ip) return "";
  return crypto.createHash("sha256").update(`${env.auth.jwtSecret}:${ip}`).digest("hex");
}
