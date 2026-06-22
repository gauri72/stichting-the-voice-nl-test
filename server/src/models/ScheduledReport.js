import mongoose from "mongoose";
import { SCHEDULE_FREQUENCIES, EXPORT_FORMATS } from "../config/reportsConfig.js";

const scheduledReportSchema = new mongoose.Schema(
  {
    scheduledReportId: { type: String, unique: true, sparse: true, trim: true, index: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "SavedReport", required: true, index: true },
    frequency: { type: String, enum: SCHEDULE_FREQUENCIES, required: true },
    recipients: [{ type: String, lowercase: true, trim: true }],
    format: { type: String, enum: EXPORT_FORMATS, default: "pdf" },
    nextRunAt: { type: Date, default: null, index: true },
    lastRunAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "paused", "completed"], default: "active", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "scheduled_reports" }
);

const ScheduledReport =
  mongoose.models.ScheduledReport || mongoose.model("ScheduledReport", scheduledReportSchema);

export default ScheduledReport;
