import dotenv from "dotenv";
import { stripEnv } from "./stripEnv.js";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  // Public, internet-reachable base URL of THIS API (used to build QR image / verify
  // links embedded in emails and PDFs). In production set PUBLIC_API_URL to the live
  // API host (e.g. https://voice-nl-api.onrender.com).
  publicApiUrl: (
    process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 5000}`
  ).replace(/\/$/, ""),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/voice_nl",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: (process.env.PAYMENT_CURRENCY || "eur").toLowerCase()
  },
  email: {
    host: stripEnv(process.env.EMAIL_HOST),
    port: Number(stripEnv(process.env.EMAIL_PORT)) || 587,
    secure: String(stripEnv(process.env.EMAIL_SECURE) || "false").toLowerCase() === "true",
    user: stripEnv(process.env.EMAIL_USER),
    pass: stripEnv(process.env.EMAIL_PASS),
    from: stripEnv(process.env.EMAIL_FROM),
    orgNotify: stripEnv(process.env.ORG_NOTIFY_EMAIL),
    // Official sender used for membership confirmation emails (kept separate so it
    // never falls back to a personal test mailbox). Defaults to the org address.
    membershipFrom:
      stripEnv(process.env.MEMBERSHIP_EMAIL_FROM) ||
      `Stichting The V.O.I.C.E. NL <${
        stripEnv(process.env.CONTACT_EMAIL) || "info@stichtingthevoice.nl"
      }>`
  },
  auth: {
    jwtSecret:
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV === "production"
        ? ""
        : "dev-only-jwt-secret-change-in-production"),
    googleClientId: process.env.GOOGLE_CLIENT_ID || ""
  },
  ticketTailor: {
    apiKey: process.env.TICKET_TAILOR_API_KEY || "",
    apiBase: (process.env.TICKET_TAILOR_API_BASE || "https://api.tickettailor.com").replace(
      /\/$/,
      ""
    ),
    /** Comma-separated Ticket Tailor product IDs counted as donations (default: Donate product). */
    donationProductIds: (process.env.TICKET_TAILOR_DONATION_PRODUCT_IDS || "pr_23684")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    /** Comma-separated product IDs counted as sponsorships (optional). */
    sponsorshipProductIds: (process.env.TICKET_TAILOR_SPONSORSHIP_PRODUCT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  },
  org: {
    contactEmail:
      stripEnv(process.env.CONTACT_EMAIL) ||
      stripEnv(process.env.ORG_NOTIFY_EMAIL) ||
      "info@stichtingthevoice.nl",
    tagline:
      process.env.ORG_TAGLINE ||
      "The voice of international cultural exchange in the Netherlands",
    sponsorUploadUrl:
      process.env.SPONSOR_UPLOAD_URL ||
      "https://e.pcloud.com/#/puplink?code=a0d7Z7oHyALJyo1QSVj7EPvLx5y5ySo37",
    /** Optional single line below donation thank-you email (plain text; leave empty to omit). */
    emailFooterOptional: stripEnv(process.env.EMAIL_FOOTER_OPTIONAL)
  }
};

export default env;
