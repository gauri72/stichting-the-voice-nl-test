import mongoose from "mongoose";

const cookieConsentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    anonymousId: { type: String, default: null, index: true },
    categories: {
      necessary: { type: Boolean, default: true },
      functional: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },
    doNotSell: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ["accept_all", "reject_all", "custom", "withdrawn"],
      required: true,
    },
    consentVersion: { type: String, default: "1.0" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true, collection: "cookieconsents" }
);

// Append-only audit trail: every consent event is its own document so the
// history of what was agreed to, and when, can never be overwritten.
cookieConsentSchema.index({ userId: 1, createdAt: -1 });
cookieConsentSchema.index({ anonymousId: 1, createdAt: -1 });

const CookieConsent = mongoose.models.CookieConsent || mongoose.model("CookieConsent", cookieConsentSchema);

export default CookieConsent;
