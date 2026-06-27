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
  // Logical database name (collections: users, payment_transactions, reviews, past_data).
  mongoDbName: process.env.MONGODB_DB_NAME || "voice_nl_26",
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
  captcha: {
    turnstileSecretKey: stripEnv(process.env.TURNSTILE_SECRET_KEY),
    turnstileVerifyUrl:
      process.env.TURNSTILE_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify"
  },
  ticketTailor: {
    apiKey: stripEnv(process.env.TICKET_TAILOR_API_KEY),
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
  // Periodic Ticket Tailor -> past_data sync (one aggregated doc per email).
  // Enabled by default whenever a Ticket Tailor API key is present; set
  // PAST_DATA_SYNC_ENABLED=false to turn it off.
  pastDataSync: {
    enabled: String(process.env.PAST_DATA_SYNC_ENABLED || "true").toLowerCase() !== "false",
    runOnStartup:
      String(process.env.PAST_DATA_SYNC_ON_STARTUP || "true").toLowerCase() !== "false",
    intervalHours: Math.max(1, Number(process.env.PAST_DATA_SYNC_INTERVAL_HOURS) || 24)
  },
  // Daily check for personal discount codes expiring within DISCOUNT_EXPIRY_REMINDER_DAYS
  // days; emails the assigned recipient once (tracked via expiryReminderSentAt).
  // runOnStartup defaults to false so a deploy/restart can't trigger an immediate send.
  discountExpiryReminder: {
    enabled: String(process.env.DISCOUNT_EXPIRY_REMINDER_ENABLED || "true").toLowerCase() !== "false",
    runOnStartup: String(process.env.DISCOUNT_EXPIRY_REMINDER_ON_STARTUP || "false").toLowerCase() === "true",
    intervalHours: Math.max(1, Number(process.env.DISCOUNT_EXPIRY_REMINDER_INTERVAL_HOURS) || 24),
    reminderWindowDays: Math.max(1, Number(process.env.DISCOUNT_EXPIRY_REMINDER_DAYS) || 3)
  },
  // Some local resolvers refuse SRV lookups for mongodb+srv://. In non-production,
  // fall back to public DNS so local dev can reach Atlas. Override with DNS_SERVERS.
  dnsServers: (process.env.DNS_SERVERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
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
  },
  wallet: {
    apple: {
      passTypeIdentifier: stripEnv(process.env.APPLE_WALLET_PASS_TYPE_ID),
      teamIdentifier: stripEnv(process.env.APPLE_WALLET_TEAM_ID),
      wwdrCertPath: stripEnv(process.env.APPLE_WALLET_WWDR_CERT_PATH),
      signerCertPath: stripEnv(process.env.APPLE_WALLET_SIGNER_CERT_PATH),
      signerKeyPath: stripEnv(process.env.APPLE_WALLET_SIGNER_KEY_PATH),
      signerKeyPassphrase: stripEnv(process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE)
    },
    google: {
      issuerId: stripEnv(process.env.GOOGLE_WALLET_ISSUER_ID),
      classSuffix: stripEnv(process.env.GOOGLE_WALLET_CLASS_SUFFIX) || "voice_membership",
      serviceAccountEmail: stripEnv(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL),
      serviceAccountPrivateKey: (
        process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY || ""
      ).replace(/\\n/g, "\n")
    }
  },
  // CMS media: S3 storage + CloudFront delivery (Phase 2 of the visual CMS).
  // cloudFrontDomain is blank until the distribution exists — mediaStorageService
  // falls back to a (non-public) direct S3 URL until then so the code path stays
  // complete without blocking on AWS provisioning.
  aws: {
    accessKeyId: stripEnv(process.env.AWS_ACCESS_KEY_ID),
    secretAccessKey: stripEnv(process.env.AWS_SECRET_ACCESS_KEY),
    region: stripEnv(process.env.AWS_REGION) || "eu-central-1",
    s3Bucket: stripEnv(process.env.AWS_S3_BUCKET) || "voice-nl-media",
    cloudFrontDomain: stripEnv(process.env.AWS_CLOUDFRONT_DOMAIN),
    cloudFrontDistributionId: stripEnv(process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID)
  },
  // CMS AI Content Assistant (Phase 6) — blank until a key is provided;
  // aiContentAssistantService stays inert (returns a "not configured" error)
  // rather than throwing, so the UI can show a clear message instead of a 500.
  anthropic: {
    apiKey: stripEnv(process.env.ANTHROPIC_API_KEY)
  },

  // Personal AI Assistant: Web Push (VAPID keypair). Blank until provided —
  // webPushService stays inert rather than throwing on import.
  vapid: {
    publicKey: stripEnv(process.env.VAPID_PUBLIC_KEY),
    privateKey: stripEnv(process.env.VAPID_PRIVATE_KEY),
    subject: stripEnv(process.env.VAPID_SUBJECT) || "mailto:info@stichtingthevoice.nl"
  }
};

export default env;
