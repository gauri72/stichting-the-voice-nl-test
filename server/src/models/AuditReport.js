import mongoose from "mongoose";
import { AUDIT_REPORT_TYPES, AUDIT_REPORT_MODULES } from "../config/financeConfig.js";

const auditReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, sparse: true, trim: true, index: true },
    reportType: { type: String, enum: AUDIT_REPORT_TYPES, required: true, index: true },
    title: { type: String, default: "", trim: true, maxlength: 300 },
    dateRangeStart: { type: Date, default: null },
    dateRangeEnd: { type: Date, default: null },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    eventName: { type: String, default: "", trim: true },
    modulesIncluded: { type: [String], enum: AUDIT_REPORT_MODULES, default: [] },
    options: {
      includeAttachments: { type: Boolean, default: false },
      includeAuditLogs: { type: Boolean, default: true },
      includePaymentStatus: { type: Boolean, default: true },
      includeVarianceAnalysis: { type: Boolean, default: true },
      includeSummaryCharts: { type: Boolean, default: false },
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    generatedByName: { type: String, default: "", trim: true },
    generatedAt: { type: Date, default: () => new Date() },
    pdfUrl: { type: String, default: "" },
    excelUrl: { type: String, default: "" },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["draft", "generated", "finalized"], default: "generated" },
  },
  { timestamps: true, collection: "audit_reports" }
);

const AuditReport = mongoose.models.AuditReport || mongoose.model("AuditReport", auditReportSchema);

export default AuditReport;
