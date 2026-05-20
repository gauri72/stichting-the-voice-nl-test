import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { getPlan, getUpgradePlan, MEMBERSHIP_PLANS } from "../config/membershipPlans.js";
import {
  getOrdersForEmail,
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
  if (t.includes("privileged")) return "privileged";
  if (t.includes("premium family") || (t.includes("family") && t.includes("membership")))
    return "family";
  if (t.includes("single")) return "single";
  if (t.includes("vownl")) return "vownl";
  return "family";
}

function buildMembershipPayloadFromTicketTailor(user, ttOrders) {
  const latest = ttOrders[0];
  const planId = inferPlanIdFromTitle(latest.eventTitle);
  const plan = getPlan(planId) || getPlan("family");
  const startedAt = latest.createdAt ? new Date(latest.createdAt) : new Date();
  const endsAt = addYears(startedAt, plan.durationYears || 2);
  const feeLabel = formatEur(latest.amountMinor || plan.feeMinor || 0);
  const planName = latest.eventTitle || plan.name;
  const membershipNumber = buildMembershipNumber(user._id, startedAt);
  const upgrade = getUpgradePlan(plan.upgradeTo || "patron");

  return {
    hasMembership: true,
    source: "ticket_tailor",
    active: {
      statusLabel: "Active Member",
      planName,
      planNameAccent: plan.matrixTitle || planName,
      validFrom: formatDisplayDate(startedAt),
      validTo: formatDisplayDate(endsAt),
      validFromIso: startedAt.toISOString(),
      validToIso: endsAt.toISOString(),
      description: plan.description || "Membership purchased via Ticket Tailor.",
      membershipNumber,
      isActive: true
    },
    table: [
      {
        plan: planName,
        status: "Purchased",
        renewalDate: formatDisplayDate(endsAt),
        renewalDateIso: endsAt.toISOString(),
        fee: feeLabel,
        feeMinor: latest.amountMinor || plan.feeMinor || 0
      }
    ],
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

  let membership = await Membership.findOne({ userId: user._id }).sort({ startedAt: -1 }).lean();

  if (!membership) {
    if (isTicketTailorConfigured()) {
      try {
        const orders = await getOrdersForEmail(user.email);
        const { membership: ttMembership } = splitOrdersByCategory(orders);
        if (ttMembership.length > 0) {
          return buildMembershipPayloadFromTicketTailor(user, ttMembership);
        }
      } catch (err) {
        console.warn("[memberships] Ticket Tailor lookup failed:", err.message);
      }
    }

    return {
      hasMembership: false,
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
  const feeLabel = formatEur(feeMinor);
  const membershipNumber =
    membership.membershipNumber || buildMembershipNumber(user._id, startedAt);

  const upgradeKey = plan?.upgradeTo || "patron";
  const upgrade = getUpgradePlan(upgradeKey);

  return {
    hasMembership: true,
    active: {
      statusLabel: status === "Active" ? "Active Member" : status,
      planName,
      planNameAccent: plan?.matrixTitle || planName,
      validFrom: formatDisplayDate(startedAt),
      validTo: formatDisplayDate(endsAt),
      validFromIso: startedAt.toISOString(),
      validToIso: endsAt.toISOString(),
      description: plan?.description || "",
      membershipNumber,
      isActive: status === "Active"
    },
    table: [
      {
        plan: planName,
        status,
        renewalDate: formatDisplayDate(renewalAt),
        renewalDateIso: renewalAt.toISOString(),
        fee: feeLabel,
        feeMinor
      }
    ],
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
