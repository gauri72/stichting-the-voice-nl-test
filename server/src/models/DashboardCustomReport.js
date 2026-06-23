import mongoose from "mongoose";
import { REPORT_DATA_SOURCES, REPORT_METRICS, REPORT_OUTPUTS } from "../config/dashboardConfig.js";

const dashboardReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, sparse: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 500 },
    dataSource: { type: String, enum: REPORT_DATA_SOURCES, required: true },
    metric: { type: String, enum: REPORT_METRICS, default: "revenue" },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    outputFormat: { type: String, enum: REPORT_OUTPUTS, default: "table" },
    chartConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "dashboard_custom_reports" }
);

const DashboardCustomReport =
  mongoose.models.DashboardCustomReport || mongoose.model("DashboardCustomReport", dashboardReportSchema);
export default DashboardCustomReport;
