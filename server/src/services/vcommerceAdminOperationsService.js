import crypto from "node:crypto";
import BusinessProfile from "../models/BusinessProfile.js";
import BusinessOrder from "../models/BusinessOrder.js";
import BusinessProduct from "../models/BusinessProduct.js";
import VCommerceAdjustment from "../models/VCommerceAdjustment.js";
import VCommerceChargeRule from "../models/VCommerceChargeRule.js";
import VCommerceLedgerEntry from "../models/VCommerceLedgerEntry.js";
import VCommerceRiskFlag from "../models/VCommerceRiskFlag.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { logAdminAction } from "./adminAuditService.js";

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function key(prefix) {
  return `${prefix}:${crypto.randomUUID()}`;
}

export async function createAdminProduct(adminId, businessId, data) {
  const business = await BusinessProfile.findById(businessId).lean();
  if (!business) throw httpError("Business not found.", 404);
  if (!data.name?.trim()) throw httpError("Product name is required.");
  const base = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "product";
  let slug = base;
  let suffix = 1;
  while (await BusinessProduct.exists({ businessId, slug })) slug = `${base}-${suffix++}`;
  const product = await BusinessProduct.create({
    businessId,
    name: data.name.trim(),
    slug,
    description: data.description || "",
    type: data.type || "service",
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter(Boolean) : [],
    priceMinor: Number(data.priceMinor || 0),
    currency: data.currency || "eur",
    stockCount: data.stockCount === "" || data.stockCount == null ? null : Number(data.stockCount),
    isAvailable: data.isAvailable !== false,
    isFeatured: Boolean(data.isFeatured),
    tags: Array.isArray(data.tags) ? data.tags : [],
    deliveryInfo: data.deliveryInfo || "",
    sortOrder: Number(data.sortOrder || 0),
  });
  await logAdminAction({ adminId, action: "vcommerce.product.create", targetType: "vcommerce_business", targetId: businessId, summary: `Created product ${product.name}`, detail: { productId: product._id } });
  return product;
}

export async function deleteAdminProduct(adminId, businessId, productId) {
  const product = await BusinessProduct.findOne({ _id: productId, businessId });
  if (!product) throw httpError("Product not found.", 404);
  if (await BusinessOrder.exists({ "items.productId": productId })) {
    product.isAvailable = false;
    await product.save();
    await logAdminAction({ adminId, action: "vcommerce.product.archive", targetType: "vcommerce_business", targetId: businessId, summary: `Archived product ${product.name}` });
    return { archived: true };
  }
  await product.deleteOne();
  await logAdminAction({ adminId, action: "vcommerce.product.delete", targetType: "vcommerce_business", targetId: businessId, summary: `Deleted product ${product.name}` });
  return { deleted: true };
}

export async function listChargeRules(filter = {}) {
  const query = {};
  if (filter.businessId) query.businessId = filter.businessId;
  if (filter.active !== undefined) query.isActive = filter.active;
  return VCommerceChargeRule.find(query).populate("businessId", "businessName slug").sort({ priority: -1, createdAt: -1 }).lean();
}

export async function resolveOrderChargeRules(business) {
  const now = new Date();
  const rules = await VCommerceChargeRule.find({
    isActive: true,
    chargeType: { $in: ["platform_fee", "cashback"] },
    $or: [
      { scope: "business", businessId: business._id },
      { scope: "plan", packageId: business.packageId },
      { scope: "marketplace" },
    ],
  }).sort({ priority: -1, createdAt: -1 }).lean();
  const currentRules = rules.filter((rule) => (!rule.startsAt || rule.startsAt <= now) && (!rule.endsAt || rule.endsAt >= now));
  const pick = (chargeType) => currentRules.find((rule) => rule.chargeType === chargeType);
  return { platformFee: pick("platform_fee"), cashback: pick("cashback") };
}

export async function saveChargeRule(adminId, data, id = null) {
  if (!data.name?.trim() || !data.code?.trim()) throw httpError("Name and code are required.");
  if (data.calculation === "percentage" && Number(data.percent) > 100) throw httpError("Percentage cannot exceed 100.");
  const payload = {
    name: data.name.trim(),
    code: data.code.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_"),
    chargeType: data.chargeType,
    scope: data.scope || "marketplace",
    businessId: data.businessId || null,
    productId: data.productId || null,
    packageId: data.packageId || "",
    calculation: data.calculation || "fixed",
    amountMinor: Number(data.amountMinor || 0),
    percent: Number(data.percent || 0),
    currency: data.currency || "eur",
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    isActive: data.isActive !== false,
    priority: Number(data.priority || 0),
    notes: data.notes || "",
    updatedBy: adminId,
  };
  const rule = id
    ? await VCommerceChargeRule.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
    : await VCommerceChargeRule.create({ ...payload, createdBy: adminId });
  if (!rule) throw httpError("Charge rule not found.", 404);
  await logAdminAction({ adminId, action: id ? "vcommerce.charge_rule.update" : "vcommerce.charge_rule.create", targetType: "vcommerce_charge_rule", targetId: rule._id, summary: `${id ? "Updated" : "Created"} ${rule.name}`, detail: payload });
  return rule;
}

export async function createAdjustment(adminId, data) {
  const business = await BusinessProfile.findById(data.businessId);
  if (!business) throw httpError("Business not found.", 404);
  if (!data.reason?.trim()) throw httpError("A reason is required for every financial adjustment.");
  const amountMinor = Number(data.amountMinor || 0);
  if (amountMinor <= 0) throw httpError("Amount must be greater than zero.");
  const adjustment = await VCommerceAdjustment.create({
    businessId: business._id,
    orderId: data.orderId || null,
    chargeRuleId: data.chargeRuleId || null,
    kind: data.kind,
    chargeType: data.chargeType || "manual",
    description: data.description || `${data.kind} adjustment`,
    reason: data.reason,
    amountMinor,
    currency: data.currency || "eur",
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    maxUses: data.maxUses || null,
    payoutEffect: data.payoutEffect || (["credit", "waiver"].includes(data.kind) ? "increase" : data.kind === "deduction" ? "decrease" : "none"),
    createdBy: adminId,
  });
  const direction = ["credit", "waiver", "refund"].includes(adjustment.kind) ? "credit" : "debit";
  await VCommerceLedgerEntry.create({
    businessId: business._id,
    orderId: adjustment.orderId,
    adjustmentId: adjustment._id,
    entryType: adjustment.kind === "manual_charge" ? "manual" : adjustment.kind,
    direction,
    amountMinor,
    currency: adjustment.currency,
    description: adjustment.description,
    idempotencyKey: key("admin-adjustment"),
    metadata: { reason: adjustment.reason, payoutEffect: adjustment.payoutEffect },
    createdBy: adminId,
  });
  if (adjustment.payoutEffect !== "none") {
    const delta = adjustment.payoutEffect === "increase" ? amountMinor : -amountMinor;
    await BusinessProfile.findByIdAndUpdate(business._id, { $inc: { pendingPayoutMinor: delta } });
  }
  await logAdminAction({ adminId, action: `vcommerce.adjustment.${adjustment.kind}`, targetType: "vcommerce_business", targetId: business._id, summary: `${adjustment.kind}: ${adjustment.description}`, detail: { adjustmentId: adjustment._id, amountMinor, reason: adjustment.reason } });
  return adjustment;
}

export async function listAdjustments(filter = {}) {
  const query = {};
  if (filter.businessId) query.businessId = filter.businessId;
  if (filter.status) query.status = filter.status;
  return VCommerceAdjustment.find(query).populate("businessId", "businessName slug").populate("createdBy", "firstName lastName email").sort({ createdAt: -1 }).limit(250).lean();
}

export async function listLedger(filter = {}) {
  const query = {};
  if (filter.businessId) query.businessId = filter.businessId;
  if (filter.entryType) query.entryType = filter.entryType;
  return VCommerceLedgerEntry.find(query).populate("businessId", "businessName slug").populate("createdBy", "firstName lastName email").sort({ createdAt: -1 }).limit(500).lean();
}

export async function setOrderPayoutHold(adminId, orderId, reason = "") {
  const order = await BusinessOrder.findById(orderId);
  if (!order) throw httpError("Order not found.", 404);
  order.payoutHoldReason = reason.trim();
  await order.save();
  await logAdminAction({ adminId, action: reason ? "vcommerce.payout.hold" : "vcommerce.payout.release", targetType: "vcommerce_order", targetId: order._id, summary: reason ? `Payout held: ${reason}` : "Payout hold released" });
  return order;
}

export async function createRiskFlag(adminId, data) {
  if (!data.businessId || !data.title?.trim()) throw httpError("Business and title are required.");
  const flag = await VCommerceRiskFlag.create({ ...data, createdBy: adminId });
  await logAdminAction({ adminId, action: "vcommerce.risk.create", targetType: "vcommerce_business", targetId: data.businessId, summary: data.title, detail: { severity: flag.severity, category: flag.category } });
  return flag;
}

export async function listRiskFlags(filter = {}) {
  const query = {};
  if (filter.businessId) query.businessId = filter.businessId;
  if (filter.status) query.status = filter.status;
  return VCommerceRiskFlag.find(query).populate("businessId", "businessName slug").sort({ createdAt: -1 }).limit(250).lean();
}

export async function updateRiskFlag(adminId, id, data) {
  const allowed = ["status", "resolution", "severity"];
  const update = {};
  for (const field of allowed) if (data[field] !== undefined) update[field] = data[field];
  if (["resolved", "dismissed"].includes(update.status)) Object.assign(update, { resolvedAt: new Date(), resolvedBy: adminId });
  const flag = await VCommerceRiskFlag.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!flag) throw httpError("Risk flag not found.", 404);
  await logAdminAction({ adminId, action: "vcommerce.risk.update", targetType: "vcommerce_business", targetId: flag.businessId, summary: `${flag.title}: ${flag.status}` });
  return flag;
}

export async function getOperationsOverview() {
  const [rules, adjustments, openRisks, heldOrders, audit] = await Promise.all([
    VCommerceChargeRule.countDocuments({ isActive: true }),
    VCommerceAdjustment.aggregate([{ $match: { status: { $in: ["active", "applied"] } } }, { $group: { _id: "$kind", totalMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } }]),
    VCommerceRiskFlag.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    BusinessOrder.countDocuments({ payoutHoldReason: { $nin: ["", null] }, payoutId: null }),
    AdminAuditLog.find({ targetType: { $regex: "^vcommerce" } }).sort({ createdAt: -1 }).limit(30).populate("adminId", "firstName lastName email").lean(),
  ]);
  return { activeChargeRules: rules, adjustments, openRisks, heldOrders, recentActivity: audit };
}

export async function runAutomatedRiskScan(adminId) {
  const businesses = await BusinessProfile.find({ status: { $in: ["active", "review"] } }).lean();
  let created = 0;
  for (const business of businesses) {
    const candidates = [];
    if (business.status === "active" && !business.logoUrl) candidates.push(["content", "medium", "Missing storefront logo", "Active storefront has no managed logo asset."]);
    if (business.status === "active" && !business.bannerUrl) candidates.push(["content", "medium", "Missing storefront banner", "Active storefront has no managed banner asset."]);
    if (business.pendingPayoutMinor > 0 && !business.payoutsEnabled && !business.payoutIBAN) candidates.push(["payout", "high", "Payout method incomplete", "The seller has a balance but no enabled Stripe payout or IBAN."]);
    if (business.packageStatus === "past_due") candidates.push(["payment", "high", "Subscription past due", "The V.Commerce package subscription requires attention."]);
    for (const [category, severity, title, detail] of candidates) {
      const exists = await VCommerceRiskFlag.exists({ businessId: business._id, title, status: { $in: ["open", "reviewing"] } });
      if (!exists) {
        await VCommerceRiskFlag.create({ businessId: business._id, category, severity, title, detail, createdBy: adminId });
        created += 1;
      }
    }
  }
  await logAdminAction({ adminId, action: "vcommerce.risk.scan", targetType: "vcommerce_operations", targetId: "global", summary: `Automated risk scan created ${created} flag(s)` });
  return { scanned: businesses.length, created };
}
