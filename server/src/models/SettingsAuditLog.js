import mongoose from "mongoose";

const settingsAuditLogSchema = new mongoose.Schema(
  {
    auditId: { type: String, unique: true, sparse: true, trim: true, index: true },
    category: { type: String, required: true, index: true },
    key: { type: String, default: "", trim: true },
    action: { type: String, required: true, trim: true },
    oldValueMasked: { type: String, default: "" },
    newValueMasked: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    ipAddress: { type: String, default: "" },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "settings_audit_logs" }
);

settingsAuditLogSchema.index({ createdAt: -1 });

const SettingsAuditLog =
  mongoose.models.SettingsAuditLog || mongoose.model("SettingsAuditLog", settingsAuditLogSchema);
export default SettingsAuditLog;
