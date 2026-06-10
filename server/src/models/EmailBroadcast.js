import mongoose from "mongoose";

const AUDIENCE_SEGMENTS = [
  "all_members",
  "active_members",
  "premium_members",
  "event_attendees",
  "all_users",
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
    subject: { type: String, required: true, trim: true, maxlength: 240 },
    audienceSegment: {
      type: String,
      enum: AUDIENCE_SEGMENTS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "sending", "sent", "failed"],
      default: "draft",
      index: true,
    },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    mergeVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, default: "", trim: true, maxlength: 500 },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "email_broadcasts" }
);

emailBroadcastSchema.index({ createdAt: -1 });

const EmailBroadcast =
  mongoose.models.EmailBroadcast || mongoose.model("EmailBroadcast", emailBroadcastSchema);

export { AUDIENCE_SEGMENTS };
export default EmailBroadcast;
