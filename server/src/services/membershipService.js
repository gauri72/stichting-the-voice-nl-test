import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { getPlan, getUpgradePlan, MEMBERSHIP_PLANS } from "../config/membershipPlans.js";
import {
  getOrdersForEmail,
  getTicketTailorStatus,
  isTicketTailorConfigured,
  splitOrdersByCategory
} from "./ticketTailorService.js";

function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(d);
}

function formatEur(minor) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      Number(minor) / 100
    );
  } catch {
    return `€${(Number(minor) / 100).toFixed(2)}`;
  }
}

function formatFeeWithPeriod(feeMinor, durationYears) {
  const amount = formatEur(feeMinor);
  const years = Number(durationYears) || 1;
  return `${amount} / ${years} ${years === 1 ? "year" : "years"}`;
}

async function fetchTicketTailorMembershipOrders(email) {
  if (!isTicketTailorConfigured()) return [];
  try {
    const orders = await getOrdersForEmail(email);
    return splitOrdersByCategory(orders).membership;
  } catch (err) {
    console.warn("[memberships] Ticket Tailor lookup failed:", err.message);
    return [];
  }
}

function tableRowFromTicketTailorOrder(order, plan) {
  const startedAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const endsAt = addYears(startedAt, plan?.durationYears || 1);
  const feeMinor = order.amountMinor || plan?.feeMinor || 0;
  return {
    plan: order.eventTitle || plan?.name || "Membership",
    status: "Active",
    renewalDate: formatDisplayDate(endsAt),
    renewalDateIso: endsAt.toISOString(),
    fee: formatFeeWithPeriod(feeMinor, plan?.durationYears || 1),
    feeMinor,
    source: "ticket_tailor",
    orderId: order.id
  };
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function buildMembershipNumber(userId, startedAt) {
  const year = startedAt ? new Date(startedAt).getFullYear() : new Date().getFullYear();
  const tail = String(userId || "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `VOICE-M-${year}-${tail}`;
}

function deriveStatus(membership, now = new Date()) {
  if (!membership?.active) return "Inactive";
  const ends = membership.endsAt ? new Date(membership.endsAt) : null;
  if (ends && ends < now) return "Expired";
  return "Active";
}

function inferPlanIdFromTitle(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("privileged") && t.includes("family")) return "privilegedFamily";
  if (t.includes("privileged") && t.includes("single")) return "privilegedSingle";
  if (t.includes("privileged")) return "privilegedFamily";
  if (t.includes("premium family") || (t.includes("family") && t.includes("membership"))) return "family";
  if (t.includes("premium single") || (t.includes("single") && t.includes("membership"))) return "single";
  if (t.includes("vownl")) return "privilegedSingle";
  if (t.includes("single")) return "single";
  return "family";
}

function buildMembershipPayloadFromTicketTailor(user, ttOrders, ticketTailor) {
  const latest = ttOrders[0];
  const planId = inferPlanIdFromTitle(latest.eventTitle);
  const plan = getPlan(planId) || getPlan("family");
  const startedAt = latest.createdAt ? new Date(latest.createdAt) : new Date();
  const endsAt = addYears(startedAt, plan.durationYears || 2);
  const feeMinor = latest.amountMinor || plan.feeMinor || 0;
  const feeLabel = formatFeeWithPeriod(feeMinor, plan.durationYears || 1);
  const planName = latest.eventTitle || plan.name;
  const membershipNumber = buildMembershipNumber(user._id, startedAt);
  const upgrade = getUpgradePlan(plan.upgradeTo || "patron");

  return {
    hasMembership: true,
    source: "ticket_tailor",
    ticketTailor,
    active: {
      statusLabel: "Active Member",
      planName,
      planNameAccent: plan.matrixTitle || planName,
      validFrom: formatDisplayDate(startedAt),
      validTo: formatDisplayDate(endsAt),
      validFromIso: startedAt.toISOString(),
      validToIso: endsAt.toISOString(),
      description: plan.description || "",
      planId,
      membershipNumber,
      isActive: true
    },
    table: ttOrders.map((order) => {
      const pid = inferPlanIdFromTitle(order.eventTitle);
      const p = getPlan(pid) || plan;
      return tableRowFromTicketTailorOrder(order, p);
    }),
    benefits: (plan.benefits || []).map((text, index) => ({
      id: `benefit-${index}`,
      text
    })),
    upgrade: {
      id: upgrade.id,
      title: upgrade.title,
      description: upgrade.description,
      ctaLabel: upgrade.ctaLabel,
      href: upgrade.href
    },
    renewCta: {
      label: "Renew Membership",
      href: "/membership#membership-matrix"
    },
    downloadCard: {
      available: true,
      membershipNumber,
      memberName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      planName,
      validTo: formatDisplayDate(endsAt)
    }
  };
}

export async function getMembershipPageForUser(safeUser) {
  const user = await User.findById(safeUser.id).lean();
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const ticketTailor = await getTicketTailorStatus();
  const ttMembershipOrders = await fetchTicketTailorMembershipOrders(user.email);

  let membership = await Membership.findOne({ userId: user._id }).sort({ startedAt: -1 }).lean();

  if (!membership) {
    if (ttMembershipOrders.length > 0) {
      return buildMembershipPayloadFromTicketTailor(user, ttMembershipOrders, ticketTailor);
    }

    return {
      hasMembership: false,
      source: null,
      ticketTailor,
      active: null,
      table: [],
      benefits: [],
      upgrade: {
        ...getUpgradePlan("patron"),
        id: "patron"
      },
      joinCta: {
        label: "View membership plans",
        href: "/membership"
      }
    };
  }

  const plan = getPlan(membership.planId) || getPlan("family");
  const startedAt = membership.startedAt ? new Date(membership.startedAt) : new Date(user.createdAt);
  const endsAt = membership.endsAt
    ? new Date(membership.endsAt)
    : addYears(startedAt, plan?.durationYears || 2);
  const renewalAt = membership.renewalAt
    ? new Date(membership.renewalAt)
    : new Date(endsAt.getTime() - 30 * 24 * 60 * 60 * 1000);

  const status = deriveStatus({ ...membership, endsAt, active: membership.active });
  const planName = membership.planName || plan?.name || "Membership Plan";
  const feeMinor = membership.feeMinor ?? plan?.feeMinor ?? 0;
  const feeLabel = formatFeeWithPeriod(feeMinor, plan?.durationYears || 2);
  const membershipNumber =
    membership.membershipNumber || buildMembershipNumber(user._id, startedAt);

  const upgradeKey = plan?.upgradeTo || "patron";
  const upgrade = getUpgradePlan(upgradeKey);

  const primaryRow = {
    plan: planName,
    status,
    renewalDate: formatDisplayDate(renewalAt),
    renewalDateIso: renewalAt.toISOString(),
    fee: feeLabel,
    feeMinor,
    source: "mongodb"
  };

  const table = [primaryRow];
  for (const order of ttMembershipOrders) {
    const row = tableRowFromTicketTailorOrder(
      order,
      getPlan(inferPlanIdFromTitle(order.eventTitle)) || plan
    );
    const duplicate = table.some(
      (r) => r.plan === row.plan && r.renewalDate === row.renewalDate && r.fee === row.fee
    );
    if (!duplicate) table.push(row);
  }

  let source = "mongodb";
  if (ttMembershipOrders.length > 0) source = "mongodb_and_ticket_tailor";

  return {
    hasMembership: true,
    source,
    ticketTailor,
    active: {
      statusLabel: status === "Active" ? "Active Member" : status,
      planName,
      planNameAccent: plan?.matrixTitle || planName,
      validFrom: formatDisplayDate(startedAt),
      validTo: formatDisplayDate(endsAt),
      validFromIso: startedAt.toISOString(),
      validToIso: endsAt.toISOString(),
      description: plan?.description || "",
      planId: membership.planId || plan?.id || "family",
      membershipNumber,
      isActive: status === "Active"
    },
    table,
    benefits: (plan?.benefits || []).map((text, index) => ({
      id: `benefit-${index}`,
      text
    })),
    upgrade: {
      id: upgrade.id,
      title: upgrade.title,
      description: upgrade.description,
      ctaLabel: upgrade.ctaLabel,
      href: upgrade.href
    },
    renewCta: {
      label: "Renew Membership",
      href: "/membership#membership-matrix"
    },
    downloadCard: {
      available: status === "Active",
      membershipNumber,
      memberName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      planName,
      validTo: formatDisplayDate(endsAt)
    }
  };
}

/** Ensures a membership row exists for dev/demo when user has none (optional seed). */
export async function ensureDemoMembership(userId) {
  const existing = await Membership.findOne({ userId });
  if (existing) return existing;

  const user = await User.findById(userId);
  if (!user) return null;

  const plan = MEMBERSHIP_PLANS.family;
  const startedAt = user.createdAt || new Date();
  const endsAt = addYears(startedAt, plan.durationYears);

  return Membership.create({
    userId,
    active: true,
    planId: "family",
    planName: plan.name,
    feeMinor: plan.feeMinor,
    currency: "eur",
    startedAt,
    endsAt,
    renewalAt: new Date(endsAt.getTime() - 30 * 24 * 60 * 60 * 1000),
    membershipNumber: buildMembershipNumber(userId, startedAt)
  });
}
