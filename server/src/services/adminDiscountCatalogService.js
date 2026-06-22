import DiscountRule from "../models/DiscountRule.js";
import DiscountCode from "../models/DiscountCode.js";
import Voucher from "../models/Voucher.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import DiscountUsage from "../models/DiscountUsage.js";
import AdminAuditLog from "../models/AdminAuditLog.js";

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function logDiscount(tag, payload = {}) {
  const parts = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}]${parts ? ` ${parts}` : ""}`);
}

export function parseCatalogId(catalogId) {
  const value = String(catalogId || "");
  if (value.startsWith("legacy:")) return { kind: "legacy", id: value.slice(7) };
  if (value.startsWith("voucher:")) return { kind: "voucher", id: value.slice(8) };
  if (value.startsWith("rule:")) return { kind: "rule", id: value.slice(5) };
  return { kind: "rule", id: value };
}

function formatDiscountLabel(discountType, discountValue) {
  if (discountType === "free_ticket") return "Free ticket";
  if (discountType === "fixed_amount" || discountType === "fixed") return `€${Number(discountValue).toFixed(2)}`;
  return `${discountValue}%`;
}

function formatRuleRow(rule, stats = {}) {
  return {
    catalogId: `rule:${rule._id.toString()}`,
    id: rule._id.toString(),
    recordKind: "rule",
    discountId: rule.discountId || "",
    name: rule.name,
    code: rule.code || "",
    type: rule.type,
    source: rule.source || "platform",
    discountType: rule.discountType,
    discountValue: rule.discountValue,
    discountLabel: formatDiscountLabel(rule.discountType, rule.discountValue),
    appliesTo: rule.appliesTo,
    eligibleEventIds: (rule.eligibleEventIds || []).map((id) => id.toString()),
    status: rule.status,
    visibleToUsers: rule.visibleToUsers !== false,
    showOnDashboard: rule.showOnDashboard !== false,
    startDate: rule.startDate,
    expiryDate: rule.expiryDate,
    usage: stats.totalUses || rule.usedCount || 0,
    usageLimit: rule.usageLimit,
    revenueImpact: stats.totalDiscount || 0,
    description: rule.description || "",
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    deletedAt: rule.deletedAt,
    archivedAt: rule.archivedAt,
    isLegacy: false,
  };
}

function formatLegacyRow(legacy) {
  if (/couples night/i.test(legacy.name || "") || /10off/i.test(legacy.code || "")) {
    logDiscount("LEGACY_DISCOUNT_FOUND", { name: legacy.name, code: legacy.code, id: legacy._id });
  }

  return {
    catalogId: `legacy:${legacy._id.toString()}`,
    id: legacy._id.toString(),
    recordKind: "legacy",
    discountId: "",
    name: legacy.name,
    code: legacy.code,
    type: "legacy_code",
    source: legacy.source || "legacy",
    discountType: "percentage",
    discountValue: legacy.discountValue,
    discountLabel: `${legacy.discountValue}%`,
    appliesTo: "both",
    eligibleEventIds: (legacy.eligibleEventIds || []).map((id) => id.toString()),
    status: legacy.status || "active",
    visibleToUsers: legacy.visibleToUsers !== false,
    showOnDashboard: legacy.showOnDashboard !== false,
    startDate: legacy.startsAt,
    expiryDate: legacy.expiresAt,
    usage: legacy.usedCount || 0,
    usageLimit: legacy.usageLimit,
    revenueImpact: 0,
    description: legacy.description || "",
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    deletedAt: legacy.deletedAt,
    archivedAt: legacy.archivedAt,
    isLegacy: true,
    isGlobal: Boolean(legacy.isGlobal),
    assignedUserCount: (legacy.assignedUsers || []).length,
  };
}

function formatVoucherRow(voucher) {
  const discountType = voucher.discountType === "fixed" ? "fixed_amount" : "percentage";
  return {
    catalogId: `voucher:${voucher._id.toString()}`,
    id: voucher._id.toString(),
    recordKind: "voucher",
    discountId: "",
    name: voucher.name || voucher.code,
    code: voucher.code,
    type: "voucher",
    source: voucher.source || "voucher",
    discountType,
    discountValue: voucher.discountValue,
    discountLabel: formatDiscountLabel(discountType, voucher.discountValue),
    appliesTo: "tickets",
    eligibleEventIds: (voucher.eligibleEvents || []).map((id) => id.toString()),
    status: voucher.status,
    visibleToUsers: voucher.visibleToUsers !== false,
    showOnDashboard: voucher.showOnDashboard === true,
    startDate: null,
    expiryDate: voucher.expiryDate,
    usage: voucher.usedCount || 0,
    usageLimit: voucher.usageLimit,
    revenueImpact: 0,
    description: voucher.description || "",
    createdAt: voucher.createdAt,
    updatedAt: voucher.updatedAt,
    deletedAt: voucher.deletedAt,
    archivedAt: voucher.archivedAt,
    isLegacy: false,
  };
}

function matchesAdminFilters(row, params = {}) {
  if (params.type) {
    if (params.type === "legacy" && row.recordKind !== "legacy") return false;
    if (params.type === "voucher" && row.recordKind !== "voucher") return false;
    if (!["legacy", "voucher"].includes(params.type) && row.type !== params.type) return false;
  }

  if (params.status) {
    if (params.status === "hidden" && row.showOnDashboard !== false) return false;
    if (params.status === "deleted" && !row.deletedAt) return false;
    if (!["hidden", "deleted"].includes(params.status) && row.status !== params.status) return false;
  }

  if (params.source && row.source !== params.source) return false;

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    const haystack = [row.name, row.code, row.description, row.type, row.source].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

async function logAudit(adminId, action, targetId, summary) {
  await AdminAuditLog.create({
    adminId: adminId || null,
    action,
    targetType: "discount",
    targetId: String(targetId),
    summary,
    detail: null,
  });
}

export async function listAllDiscountsForAdmin(params = {}) {
  logDiscount("ADMIN_DISCOUNTS_FETCH_ALL_STARTED", {
    type: params.type || "all",
    status: params.status || "all",
    source: params.source || "all",
  });

  const includeDeleted = params.status === "deleted";
  const ruleQuery = includeDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null };
  const legacyQuery = includeDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null };
  const voucherQuery = includeDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null };

  const [rules, legacyRecords, vouchers] = await Promise.all([
    DiscountRule.find(ruleQuery).sort({ createdAt: -1 }).lean(),
    DiscountCode.find(legacyQuery).sort({ createdAt: -1 }).lean(),
    Voucher.find(voucherQuery).sort({ createdAt: -1 }).lean(),
  ]);

  const ruleIds = rules.map((r) => r._id);
  const usageAgg = await DiscountUsage.aggregate([
    { $match: { discountId: { $in: ruleIds } } },
    {
      $group: {
        _id: "$discountId",
        totalUses: { $sum: 1 },
        totalDiscount: { $sum: "$discountAmount" },
      },
    },
  ]);
  const usageMap = Object.fromEntries(usageAgg.map((u) => [u._id.toString(), u]));

  return [
    ...rules.map((rule) => formatRuleRow(rule, usageMap[rule._id.toString()] || {})),
    ...legacyRecords.map(formatLegacyRow),
    ...vouchers.map(formatVoucherRow),
  ]
    .filter((row) => matchesAdminFilters(row, params))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateCatalogDiscount(catalogId, payload, adminId) {
  const { kind, id } = parseCatalogId(catalogId);

  if (kind === "legacy") {
    const record = await DiscountCode.findById(id);
    if (!record) throwError("Discount not found.", 404);
    const fields = [
      "name", "description", "code", "discountValue", "isGlobal", "status",
      "visibleToUsers", "showOnDashboard", "startsAt", "expiresAt", "usageLimit", "source",
    ];
    for (const field of fields) {
      if (payload[field] !== undefined) record[field] = payload[field];
    }
    if (payload.expiryDate !== undefined) record.expiresAt = payload.expiryDate ? new Date(payload.expiryDate) : null;
    if (payload.startDate !== undefined) record.startsAt = payload.startDate ? new Date(payload.startDate) : null;
    await record.save();
    await logAudit(adminId, "Legacy Discount Updated", catalogId, `Updated legacy discount: ${record.name}`);
    return formatLegacyRow(record.toObject());
  }

  if (kind === "voucher") {
    const record = await Voucher.findById(id);
    if (!record) throwError("Voucher not found.", 404);
    const fields = ["name", "description", "code", "discountType", "discountValue", "status", "visibleToUsers", "showOnDashboard", "usageLimit", "source"];
    for (const field of fields) {
      if (payload[field] !== undefined) record[field] = payload[field];
    }
    if (payload.expiryDate !== undefined) record.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
    await record.save();
    await logAudit(adminId, "Voucher Updated", catalogId, `Updated voucher: ${record.code}`);
    return formatVoucherRow(record.toObject());
  }

  throwError("Use the standard discount rule endpoint for platform discounts.", 400);
}

export async function hideCatalogDiscountFromDashboard(catalogId, adminId) {
  const { kind, id } = parseCatalogId(catalogId);
  if (kind === "legacy") {
    const record = await DiscountCode.findByIdAndUpdate(id, { showOnDashboard: false }, { new: true });
    if (!record) throwError("Discount not found.", 404);
    await logAudit(adminId, "Legacy Discount Hidden", catalogId, `Hidden from dashboard: ${record.name}`);
    return formatLegacyRow(record.toObject());
  }
  if (kind === "voucher") {
    const record = await Voucher.findByIdAndUpdate(id, { showOnDashboard: false }, { new: true });
    if (!record) throwError("Voucher not found.", 404);
    await logAudit(adminId, "Voucher Hidden", catalogId, `Hidden from dashboard: ${record.code}`);
    return formatVoucherRow(record.toObject());
  }
  const record = await DiscountRule.findByIdAndUpdate(id, { showOnDashboard: false }, { new: true });
  if (!record) throwError("Discount not found.", 404);
  await logAudit(adminId, "Discount Hidden", catalogId, `Hidden from dashboard: ${record.name}`);
  return formatRuleRow(record.toObject());
}

export async function archiveCatalogDiscount(catalogId, adminId) {
  const { kind, id } = parseCatalogId(catalogId);
  const now = new Date();
  if (kind === "legacy") {
    const record = await DiscountCode.findByIdAndUpdate(
      id,
      { status: "archived", archivedAt: now, showOnDashboard: false, visibleToUsers: false },
      { new: true },
    );
    if (!record) throwError("Discount not found.", 404);
    await logAudit(adminId, "Legacy Discount Archived", catalogId, `Archived: ${record.name}`);
    return formatLegacyRow(record.toObject());
  }
  if (kind === "voucher") {
    const record = await Voucher.findByIdAndUpdate(
      id,
      { status: "archived", archivedAt: now, showOnDashboard: false },
      { new: true },
    );
    if (!record) throwError("Voucher not found.", 404);
    await logAudit(adminId, "Voucher Archived", catalogId, `Archived: ${record.code}`);
    return formatVoucherRow(record.toObject());
  }
  const record = await DiscountRule.findByIdAndUpdate(
    id,
    { status: "archived", archivedAt: now, showOnDashboard: false },
    { new: true },
  );
  if (!record) throwError("Discount not found.", 404);
  await logAudit(adminId, "Discount Archived", catalogId, `Archived: ${record.name}`);
  return formatRuleRow(record.toObject());
}

export async function deleteCatalogDiscount(catalogId, adminId) {
  const { kind, id } = parseCatalogId(catalogId);
  const now = new Date();
  if (kind === "legacy") {
    const record = await DiscountCode.findById(id);
    if (!record) throwError("Discount not found.", 404);
    record.deletedAt = now;
    record.status = "archived";
    record.showOnDashboard = false;
    record.visibleToUsers = false;
    await record.save();
    logDiscount("DISCOUNT_FILTERED_DELETED", { source: "legacy", code: record.code, name: record.name });
    await logAudit(adminId, "Legacy Discount Deleted", catalogId, `Deleted: ${record.name}`);
    return { ok: true };
  }
  if (kind === "voucher") {
    const record = await Voucher.findById(id);
    if (!record) throwError("Voucher not found.", 404);
    record.deletedAt = now;
    record.status = "archived";
    record.showOnDashboard = false;
    await record.save();
    logDiscount("DISCOUNT_FILTERED_DELETED", { source: "voucher", code: record.code });
    await logAudit(adminId, "Voucher Deleted", catalogId, `Deleted: ${record.code}`);
    return { ok: true };
  }
  throwError("Use the standard discount delete endpoint for platform discounts.", 400);
}

export async function bulkArchiveLegacyEventDiscounts(adminId, namePattern = /couples night/i) {
  const records = await DiscountCode.find({
    deletedAt: null,
    $or: [{ name: namePattern }, { code: /10off/i }],
  });
  const now = new Date();
  for (const record of records) {
    record.status = "archived";
    record.archivedAt = now;
    record.showOnDashboard = false;
    record.visibleToUsers = false;
    await record.save();
    logDiscount("LEGACY_DISCOUNT_FOUND", { action: "archived", name: record.name, code: record.code });
  }
  await logAudit(adminId, "Bulk Legacy Archive", "legacy", `Archived ${records.length} legacy discount(s)`);
  return { archived: records.length };
}

export async function getLegacyDiscountDetail(id) {
  const record = await DiscountCode.findById(id)
    .populate("assignedUsers", "firstName lastName email")
    .lean();
  if (!record) throwError("Discount not found.", 404);
  return {
    discount: formatLegacyRow(record),
    assignedUsers: (record.assignedUsers || []).map((u) => ({
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    })),
    usages: [],
    stats: { totalUses: record.usedCount || 0, uniqueUsers: (record.assignedUsers || []).length, totalDiscountGiven: 0, revenueGenerated: 0 },
    auditLogs: [],
  };
}

export async function getVoucherDiscountDetail(id) {
  const record = await Voucher.findById(id).lean();
  if (!record) throwError("Voucher not found.", 404);
  return {
    discount: formatVoucherRow(record),
    usages: [],
    stats: { totalUses: record.usedCount || 0, uniqueUsers: 0, totalDiscountGiven: 0, revenueGenerated: 0 },
    auditLogs: [],
  };
}
