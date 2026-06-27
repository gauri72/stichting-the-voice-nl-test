import User from "../models/User.js";
import AiAssistantSettings from "../models/AiAssistantSettings.js";
import AiAssistantCustomerOverride from "../models/AiAssistantCustomerOverride.js";
import AiUsageCounter from "../models/AiUsageCounter.js";
import AIResult from "../models/AIResult.js";
import ScheduledPrompt from "../models/ScheduledPrompt.js";

async function getOrCreateSettings() {
  let settings = await AiAssistantSettings.findOne({ key: "default" });
  if (!settings) settings = await AiAssistantSettings.create({ key: "default" });
  return settings;
}

function formatSettings(doc) {
  return {
    enabled: doc.enabled,
    tierLimits: Object.fromEntries(doc.tierLimits),
    prebuiltPrompts: doc.prebuiltPrompts.map((p) => ({ id: p._id.toString(), text: p.text, category: p.category })),
  };
}

export async function getGlobalSettings() {
  const settings = await getOrCreateSettings();
  return formatSettings(settings);
}

export async function updateGlobalSettings(updates) {
  const settings = await getOrCreateSettings();
  if (updates.enabled !== undefined) settings.enabled = Boolean(updates.enabled);
  if (updates.tierLimits) {
    for (const [tier, limit] of Object.entries(updates.tierLimits)) {
      settings.tierLimits.set(tier, Number(limit));
    }
  }
  await settings.save();
  return formatSettings(settings);
}

export async function addPrebuiltPrompt(text, category) {
  const settings = await getOrCreateSettings();
  settings.prebuiltPrompts.push({ text, category: category || "general" });
  await settings.save();
  return formatSettings(settings);
}

export async function deletePrebuiltPrompt(promptId) {
  const settings = await getOrCreateSettings();
  settings.prebuiltPrompts = settings.prebuiltPrompts.filter((p) => p._id.toString() !== promptId);
  await settings.save();
  return formatSettings(settings);
}

export async function getCustomerOverride(customerId) {
  const override = await AiAssistantCustomerOverride.findOne({ customerId }).lean();
  return {
    enabledOverride: override?.enabledOverride ?? null,
    dailyLimitOverride: override?.dailyLimitOverride ?? null,
  };
}

export async function setCustomerOverride(customerId, { enabledOverride, dailyLimitOverride }) {
  const update = {};
  if (enabledOverride !== undefined) update.enabledOverride = enabledOverride;
  if (dailyLimitOverride !== undefined) update.dailyLimitOverride = dailyLimitOverride;
  const doc = await AiAssistantCustomerOverride.findOneAndUpdate(
    { customerId },
    { customerId, ...update },
    { upsert: true, new: true }
  );
  return { enabledOverride: doc.enabledOverride, dailyLimitOverride: doc.dailyLimitOverride };
}

export async function listCustomerUsage(params = {}) {
  const monthPrefix = (params.month || new Date().toISOString().slice(0, 7));
  const usageAgg = await AiUsageCounter.aggregate([
    { $match: { date: { $regex: `^${monthPrefix}` } } },
    { $group: { _id: "$customerId", monthCount: { $sum: "$promptCount" } } },
    { $sort: { monthCount: -1 } },
    { $limit: 200 },
  ]);

  const customerIds = usageAgg.map((u) => u._id);
  const [users, overrides] = await Promise.all([
    User.find({ _id: { $in: customerIds } }).select("firstName lastName email").lean(),
    AiAssistantCustomerOverride.find({ customerId: { $in: customerIds } }).lean(),
  ]);
  const usersById = new Map(users.map((u) => [u._id.toString(), u]));
  const overridesById = new Map(overrides.map((o) => [o.customerId.toString(), o]));

  return usageAgg.map((u) => {
    const id = u._id.toString();
    const user = usersById.get(id);
    const override = overridesById.get(id);
    return {
      customerId: id,
      name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      email: user?.email || "",
      monthCount: u.monthCount,
      enabledOverride: override?.enabledOverride ?? null,
      dailyLimitOverride: override?.dailyLimitOverride ?? null,
    };
  });
}

export async function listScheduledRunLogs(limit = 100) {
  const results = await AIResult.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("customerId", "firstName lastName email")
    .lean();

  const scheduledPromptIds = [...new Set(results.map((r) => r.scheduledPromptId?.toString()).filter(Boolean))];
  const prompts = await ScheduledPrompt.find({ _id: { $in: scheduledPromptIds } }).select("promptText").lean();
  const promptsById = new Map(prompts.map((p) => [p._id.toString(), p.promptText]));

  return results.map((r) => ({
    id: r._id.toString(),
    customerName: r.customerId ? `${r.customerId.firstName} ${r.customerId.lastName}` : "Unknown",
    promptText: promptsById.get(r.scheduledPromptId?.toString()) || "",
    resultPreview: (r.resultText || "").slice(0, 160),
    deliveryMethod: r.deliveryMethod,
    deliveryStatus: r.deliveryStatus,
    deliveredAt: r.deliveredAt,
    createdAt: r.createdAt,
  }));
}

export async function getDashboardStats() {
  const [activeCustomers, totalSchedules, settings] = await Promise.all([
    AiUsageCounter.aggregate([{ $group: { _id: "$customerId" } }]).then((r) => r.length),
    ScheduledPrompt.countDocuments({ status: "active" }),
    getOrCreateSettings(),
  ]);
  return { activeCustomers, totalSchedules, enabled: settings.enabled };
}

