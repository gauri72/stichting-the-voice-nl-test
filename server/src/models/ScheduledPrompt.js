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
    deliveryMethod: { type: String, enum: ["dashboard", "email", "push"], default: "dashboard" },
    status: { type: String, enum: ["active", "paused"], default: "active", index: true },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "ai_scheduled_prompts" }
);

const ScheduledPrompt = mongoose.models.ScheduledPrompt || mongoose.model("ScheduledPrompt", scheduledPromptSchema);

export default ScheduledPrompt;
