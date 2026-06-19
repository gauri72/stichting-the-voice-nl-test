import mongoose from "mongoose";
import { FINANCE_AUDIT_ACTIONS } from "../config/financeConfig.js";

const financeAuditLogSchema = new mongoose.Schema(
  {
    auditLogId: { type: String, unique: true, sparse: true, trim: true, index: true },
    module: { type: String, default: "finance", trim: true, index: true },
    entityType: { type: String, default: "", trim: true, index: true },
    entityId: { type: String, default: "", trim: true, index: true },
    action: { type: String, enum: FINANCE_AUDIT_ACTIONS, required: true, index: true },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
    changedByRole: { type: String, default: "", trim: true },
    changedAt: { type: Date, default: () => new Date(), index: true },
    ipAddress: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: "finance_audit_logs" }
);

const FinanceAuditLog =
  mongoose.models.FinanceAuditLog || mongoose.model("FinanceAuditLog", financeAuditLogSchema);

export default FinanceAuditLog;
