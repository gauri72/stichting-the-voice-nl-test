import mongoose from "mongoose";

// Structured instead of a raw cron string — only 3 recurrence shapes exist in the
// UI, so next-run can be computed with plain date math (see aiSchedulerService.js).
const scheduleSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["daily", "weekly", "once"], required: true },
    time: { type: String, default: "08:00" }, // "HH:mm", local to timezone below
    daysOfWeek: { type: [Number], default: [] }, // 0=Sunday .. 6=Saturday, "weekly" only
    runAt: { type: Date, default: null }, // "once" only
    timezone: { type: String, default: "Europe/Amsterdam" },
  },
  { _id: false }
);

const scheduledPromptSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    promptText: { type: String, required: true, trim: true, maxlength: 1000 },
    schedule: { type: scheduleSchema, required: true },
    // In-app (the "Updates" inbox on AiScheduledPromptsPage) is always delivered — these are
    // additive, independent opt-in channels layered on top, not a single either/or choice.
    // See migrate-ai-scheduled-prompt-delivery.js for the conversion of pre-existing rows
    // that used the old single deliveryMethod enum.
    notifyEmail: { type: Boolean, default: false },
    notifyPush: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "paused"], default: "active", index: true },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "ai_scheduled_prompts" }
);

const ScheduledPrompt = mongoose.models.ScheduledPrompt || mongoose.model("ScheduledPrompt", scheduledPromptSchema);

export default ScheduledPrompt;
