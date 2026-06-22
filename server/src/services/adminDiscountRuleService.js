import DiscountRule from "../models/DiscountRule.js";
import DiscountUsage from "../models/DiscountUsage.js";
import ReferralReward from "../models/ReferralReward.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { DEFAULT_MEMBER_DISCOUNTS } from "../config/discountDefaults.js";
import { getNextSequence } from "../utils/sequence.js";

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

async function buildDiscountId() {
  const seq = await getNextSequence("discount_rule");
  const year = new Date().getFullYear();
  return `DSC-${year}-${String(seq).padStart(6, "0")}`;
}

async function logAudit(adminId, action, targetId, summary, detail = null) {
  await AdminAuditLog.create({
    adminId: adminId || null,
    action,
    targetType: "discount",
    targetId: String(targetId),
    summary,
    detail,
  });
}

function formatRule(rule) {
  if (!rule) return null;
  const r = rule.toObject ? rule.toObject() : rule;
  return {
    id: r._id.toString(),
    discountId: r.discountId || "",
    name: r.name,
    code: r.code || "",
    type: r.type,
    discountType: r.discountType,
    discountValue: r.discountValue,
    appliesTo: r.appliesTo,
    eligibleEventIds: (r.eligibleEventIds || []).map((id) => id.toString()),
    eligibleMembershipTypes: r.eligibleMembershipTypes || [],
    assignedUserId: r.assignedUserId?.toString() || "",
    assignedEmail: r.assignedEmail || "",
    isPublic: Boolean(r.isPublic),
    referrerUserId: r.referrerUserId?.toString() || "",
    referrerEmail: r.referrerEmail || "",
    referrerName: r.referrerName || "",
    rewardType: r.rewardType || "",
    rewardValue: r.rewardValue || 0,
    usageLimit: r.usageLimit,
    usageLimitPerUser: r.usageLimitPerUser,
    usedCount: r.usedCount || 0,
    minimumOrderAmount: r.minimumOrderAmount || 0,
    startDate: r.startDate,
    expiryDate: r.expiryDate,
    allowStacking: r.allowStacking !== false,
    status: r.status,
    visibleToUsers: r.visibleToUsers !== false,
    showOnDashboard: r.showOnDashboard !== false,
    source: r.source || "platform",
    deletedAt: r.deletedAt,
    archivedAt: r.archivedAt,
    description: r.description || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function formatDiscountLabel(rule) {
  if (rule.discountType === "free_ticket") return "Free ticket";
  if (rule.discountType === "percentage") return `${rule.discountValue}%`;
  return `€${Number(rule.discountValue).toFixed(2)}`;
}

function buildFilterQuery(params = {}) {
  const query = {};
  if (params.type) query.type = params.type;
  if (params.status) query.status = params.status;
  if (params.membershipType) query.eligibleMembershipTypes = params.membershipType;
  if (params.assignedUserId) query.assignedUserId = params.assignedUserId;
  if (params.eventId) query.eligibleEventIds = params.eventId;

  if (params.expiringBefore) {
    query.expiryDate = { $lte: new Date(params.expiringBefore), $gte: new Date() };
    query.status = "active";
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } },
      { assignedEmail: { $regex: q, $options: "i" } },
      { referrerEmail: { $regex: q, $options: "i" } },
      { referrerName: { $regex: q, $options: "i" } },
    ];
  }

  return query;
}

export async function getDashboardStats() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [activeDiscounts, memberUsages, personalUsages, referralRewards, totalSavings, expiringCodes] =
    await Promise.all([
      DiscountRule.countDocuments({ status: "active" }),
      DiscountUsage.countDocuments({ type: "automatic_member" }),
      DiscountUsage.countDocuments({ type: "personalized_code" }),
      ReferralReward.aggregate([
        { $match: { rewardStatus: { $in: ["approved", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$discountGiven" } } },
      ]),
      DiscountUsage.aggregate([{ $group: { _id: null, total: { $sum: "$discountAmount" } } }]),
      DiscountRule.countDocuments({
        status: "active",
        expiryDate: { $gte: now, $lte: thirtyDays },
      }),
    ]);

  return {
    activeDiscounts,
    memberDiscountsApplied: memberUsages,
    personalCodesUsed: personalUsages,
    referralRevenue: referralRewards[0]?.total || 0,
    totalSavingsGiven: totalSavings[0]?.total || 0,
    expiringCodes,
  };
}

export async function listDiscountRules(params = {}) {
  const query = buildFilterQuery(params);
  const rules = await DiscountRule.find(query).sort({ createdAt: -1 }).lean();

  const enriched = await Promise.all(
    rules.map(async (rule) => {
      const usageAgg = await DiscountUsage.aggregate([
        { $match: { discountId: rule._id } },
        {
          $group: {
            _id: null,
            totalUses: { $sum: 1 },
            totalDiscount: { $sum: "$discountAmount" },
            uniqueUsers: { $addToSet: "$userEmail" },
          },
        },
      ]);

      const stats = usageAgg[0] || { totalUses: 0, totalDiscount: 0, uniqueUsers: [] };
      let assignedUser = null;
      if (rule.assignedUserId) {
        const u = await User.findById(rule.assignedUserId).select("firstName lastName email").lean();
        if (u) assignedUser = { id: u._id.toString(), firstName: u.firstName, lastName: u.lastName, email: u.email };
      }

      return {
        ...formatRule(rule),
        discountLabel: formatDiscountLabel(rule),
        usage: stats.totalUses,
        revenueImpact: stats.totalDiscount,
        uniqueUsers: stats.uniqueUsers?.filter(Boolean).length || 0,
        assignedUser,
      };
    })
  );

  return enriched;
}

export async function getDiscountRuleById(id) {
  const rule = await DiscountRule.findById(id).lean();
  if (!rule) throwError("Discount not found.", 404);

  const usages = await DiscountUsage.find({ discountId: rule._id }).sort({ usedAt: -1 }).limit(50).lean();
  const referrals = await ReferralReward.find({ discountId: rule._id }).sort({ createdAt: -1 }).limit(50).lean();
  const auditLogs = await AdminAuditLog.find({ targetType: "discount", targetId: id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const usageAgg = await DiscountUsage.aggregate([
    { $match: { discountId: rule._id } },
    {
      $group: {
        _id: null,
        totalUses: { $sum: 1 },
        totalDiscount: { $sum: "$discountAmount" },
        totalRevenue: { $sum: "$totalAfterDiscount" },
        uniqueUsers: { $addToSet: "$userEmail" },
      },
    },
  ]);

  const stats = usageAgg[0] || { totalUses: 0, totalDiscount: 0, totalRevenue: 0, uniqueUsers: [] };
  const uniqueCount = stats.uniqueUsers?.filter(Boolean).length || 0;

  return {
    discount: formatRule(rule),
    stats: {
      totalUses: stats.totalUses,
      uniqueUsers: uniqueCount,
      totalDiscountGiven: stats.totalDiscount,
      revenueGenerated: stats.totalRevenue,
      conversionRate: stats.totalUses > 0 ? Math.round((uniqueCount / stats.totalUses) * 100) : 0,
      averageOrderValue: stats.totalUses > 0 ? Math.round(stats.totalRevenue / stats.totalUses) : 0,
    },
    usages: usages.map((u) => ({
      id: u._id.toString(),
      userEmail: u.userEmail,
      orderId: u.orderId,
      discountAmount: u.discountAmount,
      usedAt: u.usedAt,
    })),
    referrals: referrals.map((r) => ({
      id: r._id.toString(),
      referrerEmail: r.referrerEmail,
      buyerEmail: r.buyerEmail,
      rewardStatus: r.rewardStatus,
      discountGiven: r.discountGiven,
      createdAt: r.createdAt,
    })),
    auditLogs: auditLogs.map((l) => ({
      action: l.action,
      summary: l.summary,
      createdAt: l.createdAt,
    })),
  };
}

export async function createDiscountRule(payload, adminId) {
  const {
    name,
    code,
    type,
    discountType,
    discountValue,
    appliesTo,
    eligibleEventIds,
    eligibleMembershipTypes,
    assignedUserId,
    assignedEmail,
    isPublic,
    referrerUserId,
    referrerEmail,
    referrerName,
    rewardType,
    rewardValue,
    usageLimit,
    usageLimitPerUser,
    minimumOrderAmount,
    startDate,
    expiryDate,
    allowStacking,
    status,
    description,
    visibleToUsers,
    showOnDashboard,
    source,
  } = payload;

  if (!name?.trim() || !type || !discountType || discountValue === undefined) {
    throwError("Name, type, discount type, and discount value are required.");
  }

  const needsCode = !["automatic_member"].includes(type);
  const cleanCode = needsCode ? String(code || "").trim().toUpperCase() : "";
  if (needsCode && !cleanCode) throwError("Code is required for this discount type.");

  if (cleanCode) {
    const existing = await DiscountRule.findOne({ code: cleanCode }).select("_id").lean();
    if (existing) throwError(`Code '${cleanCode}' already exists.`);
  }

  const discountId = await buildDiscountId();
  const rule = await DiscountRule.create({
    discountId,
    name: name.trim(),
    code: cleanCode,
    type,
    discountType,
    discountValue: Number(discountValue),
    appliesTo: appliesTo || "tickets",
    eligibleEventIds: Array.isArray(eligibleEventIds) ? eligibleEventIds : [],
    eligibleMembershipTypes: Array.isArray(eligibleMembershipTypes) ? eligibleMembershipTypes : [],
    assignedUserId: assignedUserId || null,
    assignedEmail: String(assignedEmail || "").toLowerCase().trim(),
    isPublic: Boolean(isPublic),
    referrerUserId: referrerUserId || null,
    referrerEmail: String(referrerEmail || "").toLowerCase().trim(),
    referrerName: String(referrerName || "").trim(),
    rewardType: rewardType || "",
    rewardValue: Number(rewardValue) || 0,
    usageLimit: usageLimit != null ? Number(usageLimit) : null,
    usageLimitPerUser: usageLimitPerUser != null ? Number(usageLimitPerUser) : null,
    minimumOrderAmount: Number(minimumOrderAmount) || 0,
    startDate: startDate ? new Date(startDate) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    allowStacking: allowStacking !== false,
    status: status || "active",
    description: String(description || "").trim(),
    visibleToUsers: visibleToUsers !== false,
    showOnDashboard: showOnDashboard !== false,
    source: source || "platform",
    createdBy: adminId || null,
  });

  await logAudit(adminId, "Discount Created", rule._id, `Created discount: ${rule.name}`);
  return formatRule(rule);
}

export async function updateDiscountRule(id, payload, adminId) {
  const rule = await DiscountRule.findById(id);
  if (!rule) throwError("Discount not found.", 404);

  const fields = [
    "name", "code", "type", "discountType", "discountValue", "appliesTo",
    "eligibleEventIds", "eligibleMembershipTypes", "assignedUserId", "assignedEmail",
    "isPublic", "referrerUserId", "referrerEmail", "referrerName", "rewardType",
    "rewardValue", "usageLimit", "usageLimitPerUser", "minimumOrderAmount",
    "startDate", "expiryDate", "allowStacking", "status", "description",
    "visibleToUsers", "showOnDashboard", "source",
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      if (field === "code") rule.code = String(payload.code || "").trim().toUpperCase();
      else if (field === "assignedEmail" || field === "referrerEmail") rule[field] = String(payload[field] || "").toLowerCase().trim();
      else if (field === "startDate" || field === "expiryDate") rule[field] = payload[field] ? new Date(payload[field]) : null;
      else rule[field] = payload[field];
    }
  }

  await rule.save();
  await logAudit(adminId, "Discount Updated", id, `Updated discount: ${rule.name}`);
  return formatRule(rule);
}

export async function deleteDiscountRule(id, adminId) {
  const rule = await DiscountRule.findById(id);
  if (!rule) throwError("Discount not found.", 404);
  await rule.deleteOne();
  await logAudit(adminId, "Discount Deleted", id, `Deleted discount: ${rule.name}`);
  return { ok: true };
}

export async function pauseDiscountRule(id, adminId) {
  const rule = await DiscountRule.findByIdAndUpdate(id, { status: "paused" }, { new: true });
  if (!rule) throwError("Discount not found.", 404);
  await logAudit(adminId, "Discount Paused", id, `Paused discount: ${rule.name}`);
  return formatRule(rule);
}

export async function activateDiscountRule(id, adminId) {
  const rule = await DiscountRule.findByIdAndUpdate(id, { status: "active" }, { new: true });
  if (!rule) throwError("Discount not found.", 404);
  await logAudit(adminId, "Discount Activated", id, `Activated discount: ${rule.name}`);
  return formatRule(rule);
}

export async function duplicateDiscountRule(id, adminId) {
  const source = await DiscountRule.findById(id).lean();
  if (!source) throwError("Discount not found.", 404);

  const discountId = await buildDiscountId();
  let newCode = source.code ? `${source.code}-COPY` : "";
  if (newCode) {
    let suffix = 1;
    while (await DiscountRule.findOne({ code: newCode }).select("_id").lean()) {
      suffix += 1;
      newCode = `${source.code}-COPY${suffix}`;
    }
  }

  const { name, type, discountType, discountValue, appliesTo, eligibleEventIds, eligibleMembershipTypes,
    assignedUserId, assignedEmail, isPublic, referrerUserId, referrerEmail, referrerName,
    rewardType, rewardValue, usageLimit, usageLimitPerUser, minimumOrderAmount,
    startDate, expiryDate, allowStacking, status, description } = source;

  const copy = await DiscountRule.create({
    discountId,
    name: `${name} (Copy)`,
    code: newCode,
    type,
    discountType,
    discountValue,
    appliesTo,
    eligibleEventIds: eligibleEventIds || [],
    eligibleMembershipTypes: eligibleMembershipTypes || [],
    assignedUserId: assignedUserId || null,
    assignedEmail: assignedEmail || "",
    isPublic: Boolean(isPublic),
    referrerUserId: referrerUserId || null,
    referrerEmail: referrerEmail || "",
    referrerName: referrerName || "",
    rewardType: rewardType || "",
    rewardValue: rewardValue || 0,
    usageLimit,
    usageLimitPerUser,
    minimumOrderAmount: minimumOrderAmount || 0,
    startDate,
    expiryDate,
    allowStacking: allowStacking !== false,
    status: "paused",
    description: description || "",
    usedCount: 0,
    createdBy: adminId || null,
  });

  await logAudit(adminId, "Discount Created", copy._id, `Duplicated from ${source.name}`);
  return formatRule(copy);
}

export async function getDiscountUsage(id, params = {}) {
  const rule = await DiscountRule.findById(id).select("_id name").lean();
  if (!rule) throwError("Discount not found.", 404);

  const query = { discountId: rule._id };
  if (params.userEmail) query.userEmail = params.userEmail.toLowerCase();

  const usages = await DiscountUsage.find(query).sort({ usedAt: -1 }).limit(500).lean();
  return usages.map((u) => ({
    id: u._id.toString(),
    code: u.code,
    type: u.type,
    userEmail: u.userEmail,
    orderId: u.orderId,
    eventId: u.eventId?.toString() || "",
    discountAmount: u.discountAmount,
    totalAfterDiscount: u.totalAfterDiscount,
    usedAt: u.usedAt,
  }));
}

export async function exportDiscountUsage(params = {}) {
  const query = buildFilterQuery(params);
  const rules = await DiscountRule.find(query).select("_id name code type").lean();
  const ruleIds = rules.map((r) => r._id);

  const usages = await DiscountUsage.find({ discountId: { $in: ruleIds } })
    .sort({ usedAt: -1 })
    .lean();

  const ruleMap = Object.fromEntries(rules.map((r) => [r._id.toString(), r]));
  const events = await Event.find({}).select("title").lean();
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));

  const header = "Code,Name,Type,User Email,Order ID,Event,Discount Amount,Total After Discount,Used At\n";
  const rows = usages.map((u) => {
    const rule = ruleMap[u.discountId.toString()] || {};
    const eventTitle = eventMap[u.eventId?.toString()] || "";
    return [
      rule.code || "",
      `"${(rule.name || "").replace(/"/g, '""')}"`,
      u.type,
      u.userEmail,
      u.orderId,
      `"${eventTitle.replace(/"/g, '""')}"`,
      (u.discountAmount / 100).toFixed(2),
      (u.totalAfterDiscount / 100).toFixed(2),
      u.usedAt ? new Date(u.usedAt).toISOString() : "",
    ].join(",");
  });

  return header + rows.join("\n");
}

export async function syncDefaultMemberDiscounts(adminId) {
  let created = 0;
  let updated = 0;

  for (const def of DEFAULT_MEMBER_DISCOUNTS) {
    const existing = await DiscountRule.findOne({
      type: "automatic_member",
      eligibleMembershipTypes: def.eligibleMembershipTypes[0],
    });

    if (existing) {
      existing.discountType = def.discountType;
      existing.discountValue = def.discountValue;
      existing.appliesTo = def.appliesTo;
      existing.allowStacking = def.allowStacking;
      existing.status = def.status;
      existing.name = def.name;
      await existing.save();
      updated += 1;
    } else {
      const discountId = await buildDiscountId();
      await DiscountRule.create({ ...def, discountId, createdBy: adminId || null });
      created += 1;
    }
  }

  await logAudit(adminId, "Discount Updated", "sync", `Synced member discounts: ${created} created, ${updated} updated`);
  return { created, updated };
}

export async function listReferrals(params = {}) {
  const query = {};
  if (params.status) query.rewardStatus = params.status;

  const rewards = await ReferralReward.find(query).sort({ createdAt: -1 }).limit(200).lean();
  return rewards.map((r) => ({
    id: r._id.toString(),
    rewardId: r.rewardId,
    referrerEmail: r.referrerEmail,
    buyerEmail: r.buyerEmail,
    orderId: r.orderId,
    discountGiven: r.discountGiven,
    rewardType: r.rewardType,
    rewardValue: r.rewardValue,
    rewardStatus: r.rewardStatus,
    approvedAt: r.approvedAt,
    paidAt: r.paidAt,
    createdAt: r.createdAt,
  }));
}

export async function approveReferralReward(id, adminId) {
  const reward = await ReferralReward.findByIdAndUpdate(
    id,
    { rewardStatus: "approved", approvedAt: new Date() },
    { new: true }
  );
  if (!reward) throwError("Referral reward not found.", 404);
  await logAudit(adminId, "Referral Reward Approved", id, `Approved reward for ${reward.referrerEmail}`);
  return reward;
}

export async function markReferralRewardPaid(id, adminId) {
  const reward = await ReferralReward.findByIdAndUpdate(
    id,
    { rewardStatus: "paid", paidAt: new Date() },
    { new: true }
  );
  if (!reward) throwError("Referral reward not found.", 404);
  await logAudit(adminId, "Referral Reward Paid", id, `Marked paid for ${reward.referrerEmail}`);
  return reward;
}

export async function cancelReferralReward(id, adminId) {
  const reward = await ReferralReward.findByIdAndUpdate(
    id,
    { rewardStatus: "cancelled" },
    { new: true }
  );
  if (!reward) throwError("Referral reward not found.", 404);
  await logAudit(adminId, "Referral Reward Created", id, `Cancelled reward for ${reward.referrerEmail}`);
  return reward;
}

export async function listUsersForAssignment() {
  const users = await User.find({}).sort({ firstName: 1 }).select("firstName lastName email").lean();
  return users.map((u) => ({
    id: u._id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
  }));
}

export async function listEventsForEligibility() {
  const events = await Event.find({ status: { $in: ["published", "draft"] } })
    .sort({ date: -1 })
    .select("title date status")
    .lean();
  return events.map((e) => ({
    id: e._id.toString(),
    title: e.title,
    date: e.date,
    status: e.status,
  }));
}

export async function getUserReferralData(userId, email) {
  const referralCode = await DiscountRule.findOne({
    type: "referral_code",
    $or: [{ referrerUserId: userId }, { referrerEmail: email?.toLowerCase() }],
    status: "active",
  }).lean();

  const rewards = await ReferralReward.find({
    $or: [{ referrerUserId: userId }, { referrerEmail: email?.toLowerCase() }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const usages = referralCode
    ? await DiscountUsage.countDocuments({ discountId: referralCode._id })
    : 0;

  const pendingRewards = rewards.filter((r) => r.rewardStatus === "pending").length;
  const totalEarned = rewards
    .filter((r) => r.rewardStatus === "paid" || r.rewardStatus === "approved")
    .reduce((sum, r) => sum + (r.rewardValue || 0), 0);

  return {
    referralCode: referralCode
      ? { code: referralCode.code, id: referralCode._id.toString() }
      : null,
    referralUses: usages,
    rewardsEarned: totalEarned,
    pendingRewards,
    rewards: rewards.slice(0, 10).map((r) => ({
      id: r._id.toString(),
      buyerEmail: r.buyerEmail,
      rewardStatus: r.rewardStatus,
      rewardValue: r.rewardValue,
      createdAt: r.createdAt,
    })),
  };
}
