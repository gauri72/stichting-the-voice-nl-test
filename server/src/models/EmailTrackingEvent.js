import mongoose from "mongoose";

const TRACKING_EVENT_TYPES = [
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

const emailTrackingEventSchema = new mongoose.Schema(
  {
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcast", required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcastRecipient", required: true, index: true },
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcastLink", default: null },
    eventType: { type: String, enum: TRACKING_EVENT_TYPES, required: true, index: true },
    trackingIdentifier: { type: String, required: true, index: true },
    // Dedupe key for a future webhook-capable provider — sparse so today's self-hosted
    // open/click events (which have no provider event ID) don't collide on null.
    providerEventId: { type: String, default: null },
    ipHash: { type: String, default: "" },
    userAgent: { type: String, default: "", maxlength: 400 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "email_tracking_events" }
);

emailTrackingEventSchema.index({ broadcastId: 1, eventType: 1 });
emailTrackingEventSchema.index({ providerEventId: 1 }, { unique: true, sparse: true });
emailTrackingEventSchema.index({ createdAt: -1 });

const EmailTrackingEvent =
  mongoose.models.EmailTrackingEvent || mongoose.model("EmailTrackingEvent", emailTrackingEventSchema);

export { TRACKING_EVENT_TYPES };
export default EmailTrackingEvent;
