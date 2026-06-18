import AdminAuditLog from "../models/AdminAuditLog.js";

export async function logAdminAction({
  adminId,
  action,
  targetType = "membership",
  targetId = "",
  summary = "",
  detail = null,
}) {
  try {
    await AdminAuditLog.create({
      adminId: adminId || null,
      action,
      targetType,
      targetId: String(targetId || ""),
      summary,
      detail,
    });
  } catch (error) {
    console.warn("[audit] Could not write admin audit log:", error.message);
  }
}

export async function getAuditLogsForTarget(targetId, limit = 50) {
  return AdminAuditLog.find({ targetId: String(targetId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
