import DiscountRule from "../models/DiscountRule.js";
import DiscountCode from "../models/DiscountCode.js";
import Voucher from "../models/Voucher.js";
import Event from "../models/Event.js";
import { DASHBOARD_CODE_TYPES } from "../config/discountConfig.js";
import { countUserDiscountUsage } from "./discountService.js";

function logDiscount(tag, payload = {}) {
  const parts = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}]${parts ? ` ${parts}` : ""}`);
}

function isWithinSchedule(startDate, expiryDate, now = new Date()) {
  if (startDate && now < new Date(startDate)) return false;
  if (expiryDate && now > new Date(expiryDate)) return false;
  return true;
}

function formatDiscountValue(discountType, discountValue) {
  if (discountType === "fixed_amount" || discountType === "fixed") {
    return { label: `€${Number(discountValue).toFixed(2)} off`, discountValue, discountType: "fixed_amount" };
  }
  if (discountType === "free_ticket") {
    return { label: "Free ticket", discountValue: 100, discountType: "percentage" };
  }
  return { label: `${discountValue}% off`, discountValue, discountType: "percentage" };
}

async function eventIdsAreUpcoming(eventIds) {
  if (!Array.isArray(eventIds) || eventIds.length === 0) return true;
  const now = new Date();
  const events = await Event.find({ _id: { $in: eventIds } }).select("date status").lean();
  if (!events.length) return false;
  return events.some((event) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const isPast = eventDate && eventDate < now;
    const isCancelled = event.status === "cancelled" || event.status === "archived";
    return !isPast && !isCancelled;
  });
}

async function filterPastEventDiscounts(items) {
  const kept = [];
  for (const item of items) {
    if (!item.eligibleEventIds?.length) {
      kept.push(item);
      continue;
    }
    const upcoming = await eventIdsAreUpcoming(item.eligibleEventIds);
    if (upcoming) {
      kept.push(item);
    } else {
      logDiscount("DISCOUNT_FILTERED_EVENT_PAST", { code: item.code, name: item.name });
    }
  }
  return kept;
}

function userEligibleForRule(rule, userId, userEmail) {
  if (rule.isPublic) return true;
  if (rule.assignedUserId && userId && rule.assignedUserId.toString() === userId.toString()) return true;
  if (rule.assignedEmail && userEmail && rule.assignedEmail.toLowerCase() === userEmail.toLowerCase()) {
    return true;
  }
  return false;
}

function userEligibleForLegacy(legacy, userId) {
  if (legacy.isGlobal) return true;
  if (!userId) return false;
  return (legacy.assignedUsers || []).some((id) => id.toString() === userId.toString());
}

async function collectRuleDiscounts(userId, userEmail) {
  const rules = await DiscountRule.find({
    type: { $in: DASHBOARD_CODE_TYPES },
    status: "active",
    deletedAt: null,
    visibleToUsers: { $ne: false },
    showOnDashboard: { $ne: false },
    code: { $ne: "" },
  })
    .sort({ createdAt: -1 })
    .lean();

  const results = [];
  const now = new Date();

  for (const rule of rules) {
    if (!isWithinSchedule(rule.startDate, rule.expiryDate, now)) {
      logDiscount("DISCOUNT_FILTERED_EXPIRED", { source: "discount_rule", code: rule.code, name: rule.name });
      continue;
    }
    if (!userEligibleForRule(rule, userId, userEmail)) continue;
    if (rule.usageLimit != null && rule.usedCount >= rule.usageLimit) continue;
    if (rule.usageLimitPerUser != null) {
      const used = await countUserDiscountUsage(rule._id, userId, userEmail);
      if (used >= rule.usageLimitPerUser) continue;
    }

    const value = formatDiscountValue(rule.discountType, rule.discountValue);
    results.push({
      id: rule._id.toString(),
      catalogId: `rule:${rule._id.toString()}`,
      source: rule.source || "platform",
      name: rule.name,
      description: rule.description || "",
      code: rule.code,
      discountValue: value.discountValue,
      discountType: value.discountType,
      discountLabel: value.label,
      expiresAt: rule.expiryDate,
      eligibleEventIds: (rule.eligibleEventIds || []).map((id) => id.toString()),
    });
  }

  return results;
}

async function collectLegacyDiscounts(userId) {
  const legacyRecords = await DiscountCode.find({
    deletedAt: null,
    status: "active",
    visibleToUsers: { $ne: false },
    showOnDashboard: { $ne: false },
  })
    .sort({ createdAt: -1 })
    .lean();

  const results = [];
  const now = new Date();

  for (const legacy of legacyRecords) {
    if (/couples night/i.test(legacy.name || "") || /10off/i.test(legacy.code || "")) {
      logDiscount("LEGACY_DISCOUNT_FOUND", {
        name: legacy.name,
        code: legacy.code,
        status: legacy.status,
        showOnDashboard: legacy.showOnDashboard,
      });
    }

    if (!isWithinSchedule(legacy.startsAt, legacy.expiresAt, now)) {
      logDiscount("DISCOUNT_FILTERED_EXPIRED", { source: "legacy", code: legacy.code, name: legacy.name });
      continue;
    }
    if (!userEligibleForLegacy(legacy, userId)) continue;
    if (legacy.usageLimit != null && legacy.usedCount >= legacy.usageLimit) continue;

    const value = formatDiscountValue("percentage", legacy.discountValue);
    results.push({
      id: legacy._id.toString(),
      catalogId: `legacy:${legacy._id.toString()}`,
      source: legacy.source || "legacy",
      name: legacy.name,
      description: legacy.description || "",
      code: legacy.code,
      discountValue: value.discountValue,
      discountType: value.discountType,
      discountLabel: value.label,
      expiresAt: legacy.expiresAt,
      eligibleEventIds: (legacy.eligibleEventIds || []).map((id) => id.toString()),
    });
  }

  return results;
}

async function collectVoucherDiscounts() {
  const vouchers = await Voucher.find({
    status: "active",
    deletedAt: null,
    visibleToUsers: { $ne: false },
    showOnDashboard: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const results = [];

  for (const voucher of vouchers) {
    if (!isWithinSchedule(null, voucher.expiryDate, now)) {
      logDiscount("DISCOUNT_FILTERED_EXPIRED", { source: "voucher", code: voucher.code });
      continue;
    }
    if (voucher.usageLimit != null && voucher.usedCount >= voucher.usageLimit) continue;

    const discountType = voucher.discountType === "fixed" ? "fixed_amount" : "percentage";
    const value = formatDiscountValue(discountType, voucher.discountValue);
    results.push({
      id: voucher._id.toString(),
      catalogId: `voucher:${voucher._id.toString()}`,
      source: voucher.source || "voucher",
      name: voucher.name || voucher.code,
      description: voucher.description || "",
      code: voucher.code,
      discountValue: value.discountValue,
      discountType: value.discountType,
      discountLabel: value.label,
      expiresAt: voucher.expiryDate,
      eligibleEventIds: (voucher.eligibleEvents || []).map((id) => id.toString()),
    });
  }

  return results;
}

/** Returns only active, valid, dashboard-visible discounts for the signed-in user. */
export async function getAvailableDiscountsForUser(user) {
  const userId = user?._id || user?.id;
  const userEmail = user?.email || "";

  logDiscount("DASHBOARD_DISCOUNTS_FETCH_STARTED", { userId: userId?.toString?.() || userId, email: userEmail });

  const [rules, legacy, vouchers] = await Promise.all([
    collectRuleDiscounts(userId, userEmail),
    collectLegacyDiscounts(userId),
    collectVoucherDiscounts(),
  ]);

  logDiscount("DASHBOARD_DISCOUNTS_SOURCE", {
    rules: rules.length,
    legacy: legacy.length,
    vouchers: vouchers.length,
  });

  let discounts = [...rules, ...legacy, ...vouchers];
  discounts = await filterPastEventDiscounts(discounts);

  const seen = new Set();
  discounts = discounts.filter((item) => {
    const key = String(item.code || "").toUpperCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logDiscount("DASHBOARD_DISCOUNTS_RETURNED_COUNT", { count: discounts.length });

  return { discounts };
}
