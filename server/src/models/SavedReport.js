import mongoose from "mongoose";
import { REPORT_DATA_SOURCES, REPORT_CHART_TYPES, REPORT_GROUP_BY } from "../config/reportsConfig.js";

const savedReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, sparse: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    dataSource: { type: String, enum: REPORT_DATA_SOURCES, required: true },
    selectedFields: [{ type: String, trim: true }],
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    groupBy: { type: String, enum: [...REPORT_GROUP_BY, ""], default: "" },
    chartType: { type: String, enum: REPORT_CHART_TYPES, default: "table" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "saved_reports" }
);

const SavedReport =
  mongoose.models.SavedReport || mongoose.model("SavedReport", savedReportSchema);

export default SavedReport;
