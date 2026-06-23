import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, default: "membership", trim: true, index: true },
    targetId: { type: String, default: "", trim: true, index: true },
    summary: { type: String, default: "", trim: true, maxlength: 500 },
    detail: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: "", trim: true, maxlength: 64 },
    userAgent: { type: String, default: "", trim: true, maxlength: 500 },
    oldValueMasked: { type: String, default: "" },
    newValueMasked: { type: String, default: "" },
  },
  { timestamps: true, collection: "admin_audit_logs" }
);

const AdminAuditLog =
  mongoose.models.AdminAuditLog || mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
