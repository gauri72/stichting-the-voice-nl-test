import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { getPlan, getUpgradePlan, MEMBERSHIP_PLANS } from "../config/membershipPlans.js";
import {
  getTicketTailorStatus,
  isTicketTailorConfigured,
  loadTicketTailorAccountData,
  splitOrdersByCategory
} from "./ticketTailorService.js";

const INACTIVE_ORDER_STATUSES = new Set(["cancelled", "canceled", "refunded", "failed", "void"]);

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

export function inferPlanIdFromTitle(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("privileged") && t.includes("family")) return "privilegedFamily";
  if (t.includes("privileged") && t.includes("single")) return "privilegedSingle";
  if (t.includes("privileged")) return "privilegedFamily";
  if (t.includes("premium loyalty")) return "single";
  if (t.includes("premium family") || (t.includes("family") && t.includes("membership"))) return "family";
  if (t.includes("premium single") || (t.includes("single") && t.includes("membership"))) return "single";
  if (t.includes("vownl")) return "privilegedSingle";
  if (t.includes("single")) return "single";
  return "family";
}

function findMatchingMembershipOrder(orders, { startedAt, linkedOrderId } = {}) {
  if (linkedOrderId && orders?.length) {
    const byId = orders.find((order) => order.id === linkedOrderId);
    if (byId) return byId;
  }

  if (!startedAt || !orders?.length) return null;
  const target = new Date(startedAt).getTime();
  if (Number.isNaN(target)) return null;

  let best = null;
  let bestDelta = Infinity;
  for (const order of orders) {
    if (!order.createdAt) continue;
    const delta = Math.abs(new Date(order.createdAt).getTime() - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = order;
    }
  }
  if (best && bestDelta <= 14 * 24 * 60 * 60 * 1000) return best;
  return null;
}

function deriveIssuedMembershipStatus(issued, endsAt, now = new Date()) {
  if (issued.voidedAt) return "Inactive";
  if (!issued.isValid) return "Inactive";
  const end = endsAt ? new Date(endsAt) : null;
  if (end && end < now) return "Expired";
  return "Active";
}

/** Pick the membership record to show (matches Ticket Tailor “issued memberships” list). */
export function pickPrimaryMembershipWindow(windows, now = new Date()) {
  if (!windows?.length) return null;

  return [...windows].sort((a, b) => {
    const score = (w) => {
      const active = w.isActive ? 2 : w.status === "Expired" ? 1 : 0;
      const end = w.endsAt?.getTime() ?? 0;
      const start = w.startedAt?.getTime() ?? 0;
      return [active, end, start];
    };
    const sa = score(a);
    const sb = score(b);
    for (let i = 0; i < sa.length; i += 1) {
      if (sa[i] !== sb[i]) return sb[i] - sa[i];
    }
    return String(b.issuedMembershipId || "").localeCompare(String(a.issuedMembershipId || ""));
  })[0];
}

function evaluateIssuedMembership(issued, membershipOrders = [], now = new Date()) {
  const planId = inferPlanIdFromTitle(issued.membershipTypeName);
  const plan = getPlan(planId) || getPlan("family");
  const startedAt = issued.validFrom || issued.issueDate;
  const endsAt = issued.validTo;
  if (!startedAt || !endsAt) return null;

  const renewalAt = new Date(endsAt.getTime() - 30 * 24 * 60 * 60 * 1000);
  const matchedOrder = findMatchingMembershipOrder(membershipOrders, {
    startedAt,
    linkedOrderId: issued.linkedOrderId
  });
  const status = deriveIssuedMembershipStatus(issued, endsAt, now);
  const membershipCode = String(issued.code || "").trim();
  if (!membershipCode) return null;

  return {
    planId,
    plan,
    planName: issued.membershipTypeName || plan.name,
    planNameAccent: plan.matrixTitle || issued.membershipTypeName || plan.name,
    startedAt,
    endsAt,
    renewalAt,
    validFromDisplay: issued.validFromFormatted || formatDisplayDate(startedAt),
    validToDisplay: issued.validToFormatted || formatDisplayDate(endsAt),
    status,
    isActive: status === "Active",
    feeMinor: matchedOrder?.amountMinor ?? 0,
    orderId: matchedOrder?.id || issued.linkedOrderId || null,
    orderStatus: matchedOrder?.status || null,
    source: "ticket_tailor_issued_membership",
    membershipCode,
    membershipNumber: membershipCode,
    issuedMembershipId: issued.id
  };
}

function deriveStatusFromWindow({ endsAt, activeFlag = true, orderStatus }, now = new Date()) {
  const orderKey = String(orderStatus || "").toLowerCase();
  if (orderKey && INACTIVE_ORDER_STATUSES.has(orderKey)) return "Inactive";
  if (!activeFlag) return "Inactive";
  const end = endsAt ? new Date(endsAt) : null;
  if (end && end < now) return "Expired";
  return "Active";
}

function evaluateTicketTailorOrder(order, now = new Date()) {
  const planId = inferPlanIdFromTitle(order.eventTitle);
  const plan = getPlan(planId) || getPlan("family");
  const startedAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const endsAt = addYears(startedAt, plan.durationYears || 1);
  const status = deriveStatusFromWindow({ endsAt, orderStatus: order.status }, now);
  const renewalAt = new Date(endsAt.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    planId,
    plan,
    planName: order.eventTitle || plan.name,
    planNameAccent: plan.matrixTitle || order.eventTitle || plan.name,
    startedAt,
    endsAt,
    renewalAt,
    status,
    isActive: status === "Active",
    feeMinor: order.amountMinor || plan.feeMinor || 0,
    orderId: order.id,
    orderStatus: order.status,
    source: "ticket_tailor"
  };
}

function evaluateMongoMembership(membership, user, now = new Date()) {
  const plan = getPlan(membership.planId) || getPlan("family");
  const startedAt = membership.startedAt ? new Date(membership.startedAt) : new Date(user.createdAt);
  const endsAt = membership.endsAt
    ? new Date(membership.endsAt)
    : addYears(startedAt, plan?.durationYears || 2);
  const renewalAt = membership.renewalAt
    ? new Date(membership.renewalAt)
    : new Date(endsAt.getTime() - 30 * 24 * 60 * 60 * 1000);
  const status = deriveStatusFromWindow(
    { endsAt, activeFlag: membership.active, orderStatus: null },
    now
  );

  return {
    planId: membership.planId || plan.id,
    plan,
    planName: membership.planName || plan?.name || "Membership Plan",
    planNameAccent: plan?.matrixTitle || membership.planName || plan?.name,
    startedAt,
    endsAt,
    renewalAt,
    status,
    isActive: status === "Active",
    feeMinor: membership.feeMinor ?? plan?.feeMinor ?? 0,
    orderId: null,
    orderStatus: null,
    source: "mongodb",
    membershipNumber: membership.membershipNumber || buildMembershipNumber(user._id, startedAt)
  };
}

function windowToTableRow(window) {
  return {
    plan: window.planName,
    status: window.status,
    membershipCode: window.membershipCode || window.membershipNumber || "",
    validFrom: window.validFromDisplay || formatDisplayDate(window.startedAt),
    validFromIso: window.startedAt.toISOString(),
    renewalDate: formatDisplayDate(window.renewalAt),
    renewalDateIso: window.renewalAt.toISOString(),
    validTo: window.validToDisplay || formatDisplayDate(window.endsAt),
    validToIso: window.endsAt.toISOString(),
    fee:
      window.feeMinor > 0
        ? formatFeeWithPeriod(window.feeMinor, window.plan?.durationYears || 1)
        : "—",
    feeMinor: window.feeMinor,
    source: window.source,
    orderId: window.orderId,
    issuedMembershipId: window.issuedMembershipId || null
  };
}

/**
 * Resolve membership from Ticket Tailor issued memberships / orders and optional MongoDB row.
 * @returns {{ hasMembership: boolean, primary: object|null, ttWindows: object[], mongoWindow: object|null, verifiedVia: string|null }}
 */
export function resolveMembershipState({
  user,
  mongoMembership,
  ttMembershipOrders,
  ttIssuedMemberships,
  ticketTailorExclusive = false,
  now = new Date()
}) {
  const orderWindows = (ttMembershipOrders || [])
    .map((order) => evaluateTicketTailorOrder(order, now))
    .sort((a, b) => b.startedAt - a.startedAt);

  const issuedWindows = (ttIssuedMemberships || [])
    .map((issued) => evaluateIssuedMembership(issued, ttMembershipOrders, now))
    .filter(Boolean)
    .sort((a, b) => b.endsAt - a.endsAt);

  const hasIssuedMemberships = issuedWindows.length > 0;
  const ttWindows = hasIssuedMemberships ? issuedWindows : orderWindows;

  const mongoWindow =
    !hasIssuedMemberships && !ticketTailorExclusive && mongoMembership
      ? evaluateMongoMembership(mongoMembership, user, now)
      : null;

  let primary = null;
  let verifiedVia = null;

  if (hasIssuedMemberships) {
    primary = pickPrimaryMembershipWindow(issuedWindows, now);
    verifiedVia = "ticket_tailor_issued_membership";
  } else if (ttWindows.length > 0) {
    primary = pickPrimaryMembershipWindow(ttWindows, now) || ttWindows[0];
    verifiedVia = "ticket_tailor";
  } else if (mongoWindow) {
    primary = mongoWindow;
    verifiedVia = "mongodb";
  }

  const hasMembership = Boolean(primary);

  return {
    hasMembership,
    primary,
    ttWindows,
    issuedWindows,
    mongoWindow,
    verifiedVia,
    isActive: Boolean(primary?.isActive),
    hasIssuedMemberships
  };
}

/** Earliest membership purchase date (first join), or null if none on record. */
export function getEarliestMembershipSince(resolved) {
  const timestamps = [];

  for (const w of resolved.ttWindows || []) {
    if (!w.startedAt) continue;
    const t = new Date(w.startedAt).getTime();
    if (!Number.isNaN(t)) timestamps.push(t);
  }

  if (resolved.mongoWindow?.startedAt) {
    const t = new Date(resolved.mongoWindow.startedAt).getTime();
    if (!Number.isNaN(t)) timestamps.push(t);
  }

  if (timestamps.length === 0) return null;
  return new Date(Math.min(...timestamps));
}

/** Dashboard overview card copy from resolved membership. */
export function buildMembershipOverviewFromResolved(resolved) {
  if (!resolved.hasMembership || !resolved.primary) {
    return {
      active: false,
      purchased: false,
      count: 0,
      since: null,
      value: "No",
      heading: "Membership",
      description: "No membership purchased yet.",
      validUntil: null,
      verifiedVia: resolved.verifiedVia
    };
  }

  const p = resolved.primary;
  const planLabel = p.planNameAccent || p.planName;
  let description;

  const untilLabel = p.validToDisplay || formatDisplayDate(p.endsAt);

  if (p.isActive) {
    description = `${planLabel} — valid until ${untilLabel}`;
  } else if (p.status === "Expired") {
    description = `${planLabel} — expired ${untilLabel}`;
  } else {
    description = `${planLabel} — ${p.status.toLowerCase()}`;
  }

  return {
    active: p.isActive,
    purchased: true,
    count: 1,
    since: p.startedAt.toISOString(),
    value: p.isActive ? "Yes" : p.status,
    heading: "Membership",
    description,
    validUntil: p.endsAt.toISOString(),
    planName: planLabel,
    verifiedVia: resolved.verifiedVia
  };
}

async function fetchTicketTailorMembershipData(email) {
  if (!isTicketTailorConfigured()) {
    return { membershipOrders: [], issuedMemberships: [] };
  }
  try {
    const { orders, issuedMemberships } = await loadTicketTailorAccountData(email);
    return {
      membershipOrders: splitOrdersByCategory(orders).membership,
      issuedMemberships
    };
  } catch (err) {
    console.warn("[memberships] Ticket Tailor lookup failed:", err.message);
    return { membershipOrders: [], issuedMemberships: [] };
  }
}

function buildPayloadFromResolved(user, resolved, ticketTailor) {
  if (!resolved.hasMembership || !resolved.primary) {
    return {
      hasMembership: false,
      source: null,
      verifiedVia: null,
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

  const primary = resolved.primary;
  const plan = primary.plan || getPlan(primary.planId) || getPlan("family");
  const membershipCode =
    primary.membershipCode ||
    (resolved.hasIssuedMemberships ? "" : primary.membershipNumber) ||
    buildMembershipNumber(user._id, primary.startedAt);
  const membershipNumber = membershipCode;
  const upgrade = getUpgradePlan(plan.upgradeTo || "patron");

  const table = [];
  const seen = new Set();

  for (const window of resolved.ttWindows) {
    const row = windowToTableRow(window);
    const key = row.issuedMembershipId || `${row.membershipCode}-${row.validToIso}`;
    if (!seen.has(key)) {
      seen.add(key);
      table.push(row);
    }
  }

  if (!resolved.hasIssuedMemberships && resolved.mongoWindow) {
    const row = windowToTableRow(resolved.mongoWindow);
    const key = `mongo-${row.plan}-${row.validToIso}`;
    if (!seen.has(key)) {
      seen.add(key);
      table.push(row);
    }
  }

  if (table.length === 0) {
    table.push(windowToTableRow(primary));
  }

  let source = primary.source;
  if (resolved.ttWindows.length > 0 && resolved.mongoWindow) {
    source = "mongodb_and_ticket_tailor";
  } else if (resolved.ttWindows.length > 0) {
    source = "ticket_tailor";
  }

  const statusLabel =
    primary.status === "Active"
      ? "Active Member"
      : primary.status === "Expired"
        ? "Expired Membership"
        : primary.status;

  return {
    hasMembership: true,
    source,
    verifiedVia: resolved.verifiedVia,
    ticketTailor,
    active: {
      statusLabel,
      planName: primary.planName,
      planNameAccent: primary.planNameAccent,
      validFrom: primary.validFromDisplay || formatDisplayDate(primary.startedAt),
      validTo: primary.validToDisplay || formatDisplayDate(primary.endsAt),
      validFromIso: primary.startedAt.toISOString(),
      validToIso: primary.endsAt.toISOString(),
      description: plan.description || "",
      planId: primary.planId,
      membershipNumber,
      membershipCode,
      issuedMembershipId: primary.issuedMembershipId || null,
      isActive: primary.isActive
    },
    table,
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
      label: primary.isActive ? "Renew Membership" : "Renew or upgrade",
      href: "/membership#membership-matrix"
    },
    downloadCard: {
      available: primary.isActive,
      membershipNumber,
      membershipCode,
      memberName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      planName: primary.planNameAccent || primary.planName,
      validFrom: primary.validFromDisplay || formatDisplayDate(primary.startedAt),
      validTo: primary.validToDisplay || formatDisplayDate(primary.endsAt)
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
  const { membershipOrders: ttMembershipOrders, issuedMemberships: ttIssuedMemberships } =
    await fetchTicketTailorMembershipData(user.email);
  const membership = await Membership.findOne({ userId: user._id }).sort({ startedAt: -1 }).lean();

  const ticketTailorExclusive = Boolean(
    ticketTailor.configured && ticketTailor.buyerEmailVisible
  );

  const resolved = resolveMembershipState({
    user,
    mongoMembership: membership,
    ttMembershipOrders,
    ttIssuedMemberships,
    ticketTailorExclusive
  });

  const payload = buildPayloadFromResolved(user, resolved, ticketTailor);

  if (ticketTailorExclusive && !resolved.hasIssuedMemberships && !payload.hasMembership) {
    payload.joinCta = {
      label: "View membership plans",
      href: "/membership"
    };
    payload.membershipHint =
      "No issued membership was found for your login email in Ticket Tailor. Purchases must use the same email as your account.";
  }

  return payload;
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
