import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/voice_nl",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: (process.env.PAYMENT_CURRENCY || "eur").toLowerCase()
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "",
    orgNotify: process.env.ORG_NOTIFY_EMAIL || ""
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
    )
  },
  org: {
    contactEmail:
      process.env.CONTACT_EMAIL ||
      process.env.ORG_NOTIFY_EMAIL ||
      "info@stichtingthevoice.nl",
    tagline:
      process.env.ORG_TAGLINE ||
      "The voice of international cultural exchange in the Netherlands",
    sponsorUploadUrl:
      process.env.SPONSOR_UPLOAD_URL ||
      "https://e.pcloud.com/#/puplink?code=a0d7Z7oHyALJyo1QSVj7EPvLx5y5ySo37",
    /** Optional single line below donation thank-you email (plain text; leave empty to omit). */
    emailFooterOptional: process.env.EMAIL_FOOTER_OPTIONAL || ""
  }
};

export default env;
