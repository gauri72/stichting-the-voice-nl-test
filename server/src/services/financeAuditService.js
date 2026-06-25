import FinanceAuditLog from "../models/FinanceAuditLog.js";
import { nextFinanceId } from "../utils/financeUtils.js";
import { logAdminAction } from "./adminAuditService.js";
import { escapeRegex } from "../utils/regexUtils.js";

export async function logFinanceAction({
  admin,
  action,
  entityType = "finance",
  entityId = "",
  oldValue = null,
  newValue = null,
  notes = "",
  req = null,
}) {
  const adminId = admin?.id || admin?._id || admin;
  const auditLogId = await nextFinanceId("FAL");

  try {
    await FinanceAuditLog.create({
      auditLogId,
      module: "finance",
      entityType,
      entityId: String(entityId || ""),
      action,
      oldValue,
      newValue,
      changedBy: adminId || null,
      changedByRole: admin?.role || "",
      changedAt: new Date(),
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      userAgent: req?.headers?.["user-agent"] || "",
      notes,
    });
  } catch (error) {
    console.warn("[finance-audit] Could not write log:", error.message);
  }

  await logAdminAction({
    adminId,
    action: `finance_${action}`,
    targetType: entityType,
    targetId: String(entityId || ""),
    summary: notes || action,
    detail: { oldValue, newValue },
  });
}

export async function listFinanceAuditLogs(params = {}) {
  const filter = {};
  if (params.module) filter.module = params.module;
  if (params.entityType) filter.entityType = params.entityType;
  if (params.entityId) filter.entityId = String(params.entityId);
  if (params.action) filter.action = params.action;
  if (params.dateFrom || params.dateTo) {
    filter.changedAt = {};
    if (params.dateFrom) filter.changedAt.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.changedAt.$lte = end;
    }
  }
  if (params.search) {
    const q = escapeRegex(params.search.trim());
    filter.$or = [
      { entityId: new RegExp(q, "i") },
      { notes: new RegExp(q, "i") },
      { action: new RegExp(q, "i") },
    ];
  }

  const limit = Math.min(Number(params.limit) || 100, 500);
  const docs = await FinanceAuditLog.find(filter)
    .sort({ changedAt: -1 })
    .limit(limit)
    .populate("changedBy", "firstName lastName email role")
    .lean();

  return docs.map((d) => ({
    id: d._id.toString(),
    auditLogId: d.auditLogId,
    module: d.module,
    entityType: d.entityType,
    entityId: d.entityId,
    action: d.action,
    oldValue: d.oldValue,
    newValue: d.newValue,
    changedBy: d.changedBy
      ? {
          id: d.changedBy._id.toString(),
          name: `${d.changedBy.firstName} ${d.changedBy.lastName}`,
          email: d.changedBy.email,
          role: d.changedBy.role,
        }
      : null,
    changedByRole: d.changedByRole,
    changedAt: d.changedAt,
    ipAddress: d.ipAddress,
    userAgent: d.userAgent,
    notes: d.notes,
  }));
}

export async function getAuditLogsForEntity(entityId, limit = 50) {
  return listFinanceAuditLogs({ entityId, limit });
}
