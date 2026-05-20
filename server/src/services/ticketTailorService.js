import env from "../config/env.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const PAGE_LIMIT = 100;
const MAX_PAGES = 30;

/** @type {Map<string, { at: number, orders: TicketTailorOrderSummary[] }>} */
const cacheByEmail = new Map();

/** @type {{ configured: boolean, buyerEmailVisible: boolean, warning: string|null } | null} */
let piiStatusCache = null;

function isRedactedPii(value) {
  const s = String(value || "").trim();
  if (!s) return true;
  if (s === "****" || /^[\*•]+$/.test(s)) return true;
  return false;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function authHeader() {
  const key = env.ticketTailor.apiKey;
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return { Accept: "application/json", Authorization: `Basic ${encoded}` };
}

function pickEmail(order) {
  const buyer = order?.buyer_details || order?.buyer || order?.customer || {};
  const candidates = [
    buyer.email,
    order?.email,
    order?.buyer_email,
    order?.contact_email
  ];
  for (const c of candidates) {
    const v = String(c || "").trim().toLowerCase();
    if (v && !isRedactedPii(v) && v.includes("@")) return v;
  }
  return "";
}

function getLineItems(order) {
  const items = order?.line_items || order?.items || [];
  return Array.isArray(items) ? items : [];
}

function getPrimaryLineDescription(order) {
  const items = getLineItems(order);
  if (items.length === 0) return "";
  return String(items[0]?.description || "").trim();
}

function getAllLineText(order) {
  return getLineItems(order)
    .map((it) => String(it?.description || it?.name || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function lineItemProductId(item) {
  return String(item?.item_id || item?.product_id || "").trim();
}

function isDonationOrder(order) {
  const donationIds = env.ticketTailor.donationProductIds;
  for (const it of getLineItems(order)) {
    const id = lineItemProductId(it);
    if (donationIds.includes(id)) return true;
    const d = String(it?.description || "").toLowerCase();
    if (/^donate\b|\bdonation\b/.test(d)) return true;
  }
  const blob = getAllLineText(order);
  const hasEventName = Boolean(String(order?.event_summary?.name || "").trim());
  if (!hasEventName && (/\bdonate\b|\bdonation\b/.test(blob) || blob === "donate")) {
    return true;
  }
  return false;
}

function isSponsorshipOrder(order) {
  const sponsorshipIds = env.ticketTailor.sponsorshipProductIds;
  for (const it of getLineItems(order)) {
    const id = lineItemProductId(it);
    if (sponsorshipIds.length > 0 && sponsorshipIds.includes(id)) return true;
    const d = String(it?.description || "").toLowerCase();
    if (
      /\bsponsorship\b/.test(d) ||
      (/\bsponsor\b/.test(d) &&
        !/member|ticket|festival|privileged|ghazal|adult|economy/i.test(d))
    ) {
      return true;
    }
  }
  const blob = getAllLineText(order);
  const hasEventName = Boolean(String(order?.event_summary?.name || "").trim());
  if (!hasEventName && /\bsponsorship\b/.test(blob)) return true;
  return false;
}

function isMembershipOrder(order) {
  const desc = getPrimaryLineDescription(order).toLowerCase();
  const hasEventName = Boolean(String(order?.event_summary?.name || "").trim());

  return (
    !hasEventName &&
    /\bmembership\b/i.test(desc) &&
    (/privileged membership|premium family|premium single|family membership|single membership|vownl membership|stichting v\.o\.i\.c\.e/i.test(
      desc
    ) ||
      /\bmembership\s*$/i.test(desc))
  );
}

/** @returns {"membership" | "donation" | "sponsorship" | "event"} */
function classifyOrder(order) {
  if (isDonationOrder(order)) return "donation";
  if (isSponsorshipOrder(order)) return "sponsorship";
  if (isMembershipOrder(order)) return "membership";
  return "event";
}

function pickEventTitle(order) {
  const fromSummary =
    order?.event_summary?.name ||
    order?.event_summary?.title ||
    order?.event?.name ||
    order?.event?.title;
  if (fromSummary) return String(fromSummary).trim();

  const lineDesc = getPrimaryLineDescription(order);
  if (lineDesc) return lineDesc;

  const items = order?.line_items || order?.items || [];
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0];
    const name =
      first?.event_name ||
      first?.name ||
      first?.title ||
      first?.product_name;
    if (name) return String(name).trim();
  }

  return "Event ticket";
}

function pickDisplayTitle(order, category) {
  if (category === "membership") {
    return getPrimaryLineDescription(order) || "Membership";
  }
  if (category === "donation") {
    return getPrimaryLineDescription(order) || "Donation";
  }
  if (category === "sponsorship") {
    return getPrimaryLineDescription(order) || "Sponsorship";
  }
  return pickEventTitle(order);
}

function pickAmountMinor(order) {
  const money =
    order?.total_paid ||
    order?.total ||
    order?.amount_paid ||
    order?.grand_total ||
    order?.subtotal;
  if (money == null) return 0;
  if (typeof money === "number") return money;
  if (typeof money === "object") {
    const v = money.value ?? money.amount ?? money.total;
    return Number(v) || 0;
  }
  return Number(money) || 0;
}

function pickCurrency(order) {
  const cur = order?.currency;
  if (cur && typeof cur === "object" && cur.code) {
    return String(cur.code).toUpperCase();
  }
  if (typeof cur === "string" && cur) return cur.toUpperCase();
  const money = order?.total_paid || order?.total;
  if (money && typeof money === "object" && money.currency) {
    const c = money.currency;
    return (typeof c === "string" ? c : c?.code || "EUR").toUpperCase();
  }
  return "EUR";
}

function pickCreatedIso(order) {
  const raw =
    order?.created_at ||
    order?.paid_at ||
    order?.completed_at ||
    order?.updated_at;
  if (raw == null) return null;
  if (typeof raw === "number") {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isCountableOrder(order) {
  const status = String(order?.status || "").toLowerCase();
  if (!status) return true;
  const excluded = ["cancelled", "canceled", "refunded", "failed", "void"];
  return !excluded.includes(status);
}

/**
 * @typedef {Object} TicketTailorOrderSummary
 * @property {string} id
 * @property {"membership" | "donation" | "sponsorship" | "event"} category
 * @property {string} eventTitle
 * @property {string} status
 * @property {number} amountMinor
 * @property {string} currency
 * @property {string|null} createdAt
 */

export function isTicketTailorConfigured() {
  return Boolean(env.ticketTailor.apiKey);
}

export async function getTicketTailorStatus() {
  if (!isTicketTailorConfigured()) {
    return {
      configured: false,
      buyerEmailVisible: false,
      warning: null
    };
  }

  if (piiStatusCache) return piiStatusCache;

  try {
    const { data } = await fetchOrdersPage();
    const sampleEmail = data[0]?.buyer_details?.email;
    const buyerEmailVisible =
      Boolean(sampleEmail) && !isRedactedPii(sampleEmail) && String(sampleEmail).includes("@");

    piiStatusCache = {
      configured: true,
      buyerEmailVisible,
      warning: buyerEmailVisible
        ? null
        : "Ticket Tailor is hiding buyer emails (****) on this API key. Create a new API key in Ticket Tailor box office settings and turn OFF “hide personal data”, then update TICKET_TAILOR_API_KEY on the server."
    };

    if (!buyerEmailVisible) {
      console.warn(`[ticket-tailor] ${piiStatusCache.warning}`);
    }
  } catch (err) {
    piiStatusCache = {
      configured: true,
      buyerEmailVisible: false,
      warning: `Ticket Tailor API error: ${err.message}`
    };
  }

  return piiStatusCache;
}

export function logTicketTailorConfiguration() {
  if (!isTicketTailorConfigured()) {
    console.warn(
      "[ticket-tailor] TICKET_TAILOR_API_KEY is not set — dashboard event/ticket data will use local records only."
    );
    return;
  }
  getTicketTailorStatus().then((status) => {
    if (status.buyerEmailVisible) {
      console.log("[ticket-tailor] API key configured; buyer emails visible for dashboard matching.");
    }
  });
}

async function fetchOrdersPage({ startingAfter } = {}) {
  const base = env.ticketTailor.apiBase.replace(/\/$/, "");
  const url = new URL(`${base}/v1/orders`);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (startingAfter) url.searchParams.set("starting_after", startingAfter);

  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(
      `Ticket Tailor API error (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`
    );
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const nextLink = json?.links?.next;
  let nextStartingAfter = null;
  if (nextLink) {
    try {
      const parsed = new URL(nextLink, `${base}/`);
      nextStartingAfter = parsed.searchParams.get("starting_after");
    } catch {
      const m = /starting_after=([^&]+)/.exec(String(nextLink));
      nextStartingAfter = m?.[1] || null;
    }
  }
  return { data, nextStartingAfter };
}

async function fetchOrdersMatchingEmail(norm) {
  const matched = [];
  let startingAfter;
  let page = 0;

  while (page < MAX_PAGES) {
    const { data, nextStartingAfter } = await fetchOrdersPage({ startingAfter });
    for (const order of data) {
      if (pickEmail(order) !== norm) continue;
      const summary = mapOrder(order);
      if (summary) matched.push(summary);
    }
    page += 1;
    if (!nextStartingAfter || data.length === 0) break;
    startingAfter = nextStartingAfter;
  }

  return matched;
}

/**
 * @param {object} order
 * @returns {TicketTailorOrderSummary|null}
 */
function mapOrder(order) {
  if (!order?.id || !isCountableOrder(order)) return null;
  const category = classifyOrder(order);
  return {
    id: String(order.id),
    category,
    eventTitle: pickDisplayTitle(order, category),
    status: String(order.status || "complete"),
    amountMinor: pickAmountMinor(order),
    currency: pickCurrency(order),
    createdAt: pickCreatedIso(order)
  };
}

/** @param {TicketTailorOrderSummary[]} orders */
export function splitOrdersByCategory(orders) {
  const membership = [];
  const donations = [];
  const sponsorships = [];
  const events = [];
  for (const o of orders) {
    switch (o.category) {
      case "membership":
        membership.push(o);
        break;
      case "donation":
        donations.push(o);
        break;
      case "sponsorship":
        sponsorships.push(o);
        break;
      default:
        events.push(o);
    }
  }
  return { membership, donations, sponsorships, events, all: orders };
}

/**
 * Orders for the given account email (Ticket Tailor buyer email must match).
 * @param {string} email
 * @returns {Promise<TicketTailorOrderSummary[]>}
 */
export async function getOrdersForEmail(email) {
  if (!isTicketTailorConfigured()) return [];

  const status = await getTicketTailorStatus();
  if (!status.buyerEmailVisible) return [];

  const norm = normalizeEmail(email);
  if (!norm) return [];

  const cached = cacheByEmail.get(norm);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.orders;
  }

  const matched = await fetchOrdersMatchingEmail(norm);

  matched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  cacheByEmail.set(norm, { at: Date.now(), orders: matched });
  return matched;
}
