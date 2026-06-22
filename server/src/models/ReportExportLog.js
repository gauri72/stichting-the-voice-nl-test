import mongoose from "mongoose";
import { EXPORT_FORMATS } from "../config/reportsConfig.js";

const reportExportLogSchema = new mongoose.Schema(
  {
    exportId: { type: String, unique: true, sparse: true, trim: true, index: true },
    reportType: { type: String, required: true, trim: true, index: true },
    format: { type: String, enum: EXPORT_FORMATS, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    generatedAt: { type: Date, default: Date.now, index: true },
    fileUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "report_export_logs" }
);

const ReportExportLog =
  mongoose.models.ReportExportLog || mongoose.model("ReportExportLog", reportExportLogSchema);

export default ReportExportLog;
