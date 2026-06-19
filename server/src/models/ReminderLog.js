import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema(
  {
    reminderId: { type: String, unique: true, sparse: true, trim: true, index: true },
    moduleType: { type: String, enum: ["sponsorship", "donation"], required: true, index: true },
    recordId: { type: String, required: true, index: true },
    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    templateType: { type: String, required: true, trim: true },
    subject: { type: String, default: "", trim: true },
    customNote: { type: String, default: "", trim: true, maxlength: 1000 },
    sentAt: { type: Date, default: () => new Date() },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    status: { type: String, enum: ["sent", "failed"], default: "sent" },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true, collection: "reminder_logs" }
);

reminderLogSchema.index({ moduleType: 1, recordId: 1, sentAt: -1 });

const ReminderLog =
  mongoose.models.ReminderLog || mongoose.model("ReminderLog", reminderLogSchema);

export default ReminderLog;
