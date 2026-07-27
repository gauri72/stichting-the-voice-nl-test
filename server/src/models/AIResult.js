import mongoose from "mongoose";

// Each channel tracks its own delivery outcome independently — a push failure must never
// affect the email channel's status or vice versa. In-app is a plain, always-"delivered"
// marker (creating this document IS the in-app delivery); email/push carry the full
// retry-with-backoff state (see aiSchedulerService.js's retry pass).
const deliveryChannelSchema = new mongoose.Schema(
  {
    requested: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["not_requested", "pending_retry", "delivered", "failed"],
      default: "not_requested",
    },
    attempts: { type: Number, default: 0 },
    nextRetryAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
  },
  { _id: false }
);

const aiResultSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledPromptId: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledPrompt", required: true, index: true },
    resultText: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
    channels: {
      inApp: {
        status: { type: String, enum: ["delivered"], default: "delivered" },
      },
      email: { type: deliveryChannelSchema, default: () => ({}) },
      push: { type: deliveryChannelSchema, default: () => ({}) },
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "ai_results" }
);

// Backs the scheduler's retry-pass query (find channels due for a retry attempt).
aiResultSchema.index({ "channels.email.status": 1, "channels.email.nextRetryAt": 1 });
aiResultSchema.index({ "channels.push.status": 1, "channels.push.nextRetryAt": 1 });

const AIResult = mongoose.models.AIResult || mongoose.model("AIResult", aiResultSchema);

export default AIResult;
