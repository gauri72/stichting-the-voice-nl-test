import mongoose from "mongoose";

const RECIPIENT_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "soft_bounced",
  "hard_bounced",
  "failed",
  "rejected",
  "complained",
  "unsubscribed",
];

const emailBroadcastRecipientSchema = new mongoose.Schema(
  {
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcast", required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: RECIPIENT_STATUSES, default: "queued", index: true },
    providerMessageId: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    firstOpenedAt: { type: Date, default: null },
    lastOpenedAt: { type: Date, default: null },
    openCount: { type: Number, default: 0 },
    firstClickedAt: { type: Date, default: null },
    lastClickedAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0 },
    bounceType: { type: String, enum: ["hard", "soft", ""], default: "" },
    bounceReason: { type: String, default: "", maxlength: 500 },
    failureReason: { type: String, default: "", maxlength: 500 },
    retryCount: { type: Number, default: 0 },
    // Opaque, unguessable per-recipient token embedded in this broadcast's tracking pixel
    // and click-redirect links — never the email address or userId, so the public tracking
    // endpoints can't be enumerated or used to infer who received/opened what.
    trackingIdentifier: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true, collection: "email_broadcast_recipients" }
);

emailBroadcastRecipientSchema.index({ broadcastId: 1, email: 1 }, { unique: true });

const EmailBroadcastRecipient =
  mongoose.models.EmailBroadcastRecipient ||
  mongoose.model("EmailBroadcastRecipient", emailBroadcastRecipientSchema);

export { RECIPIENT_STATUSES };
export default EmailBroadcastRecipient;
