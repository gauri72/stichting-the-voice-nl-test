import mongoose from "mongoose";

const AUDIENCE_SEGMENTS = [
  "all_members",
  "active_members",
  "premium_members",
  "event_attendees",
  "all_users",
  "test_users",
];

const emailBroadcastSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      required: true,
      index: true,
    },
    templateName: { type: String, required: true, trim: true, maxlength: 160 },
    // Distinct from templateName — a template can be reused across many campaigns with
    // different campaign names (e.g. the same "Newsletter" template sent as both "July
    // Newsletter" and "August Newsletter"). Falls back to templateName when not set.
    campaignName: { type: String, default: "", trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 240 },
    audienceSegment: {
      type: String,
      enum: AUDIENCE_SEGMENTS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "partially_sent", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    scheduledFor: { type: Date, default: null },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    // Unique-recipient counts — a recipient who opens/clicks the same email 5 times still
    // only counts once here; total (non-unique) counts live on EmailBroadcastRecipient rows.
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    bouncedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },
    mergeVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
    customEmails: { type: [String], default: [] },
    errorMessage: { type: String, default: "", trim: true, maxlength: 500 },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    // The exact rendered HTML (post tracking-pixel/link injection) at the moment this
    // broadcast was sent — the template itself may be edited or deleted afterward, but this
    // snapshot stays immutable so the report/PDF always reflects what recipients actually
    // received, not the template's current state.
    htmlSnapshot: { type: String, default: "" },
    pdfAsset: {
      s3Key: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      version: { type: Number, default: 0 },
    },
    pdfStatus: {
      type: String,
      enum: ["idle", "queued", "generating", "ready", "error"],
      default: "idle",
    },
    pdfError: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true, collection: "email_broadcasts" }
);

emailBroadcastSchema.index({ createdAt: -1 });

const EmailBroadcast =
  mongoose.models.EmailBroadcast || mongoose.model("EmailBroadcast", emailBroadcastSchema);

export { AUDIENCE_SEGMENTS };
export default EmailBroadcast;
