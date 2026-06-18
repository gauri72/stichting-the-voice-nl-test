import env from "../config/env.js";
import PastData from "../models/PastData.js";
import { isTicketTailorConfigured } from "./ticketTailorService.js";

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

function authHeader() {
  const encoded = Buffer.from(`${env.ticketTailor.apiKey}:`).toString("base64");
  return { Accept: "application/json", Authorization: `Basic ${encoded}` };
}

function parseDateField(field) {
  if (field == null) return null;
  if (typeof field === "string") {
    const d = new Date(field);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof field === "number") {
    const ms = field < 1e12 ? field * 1000 : field;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof field === "object") {
    const raw = field.iso ?? field.date ?? (field.unix != null ? field.unix : null);
    if (raw == null) return null;
    if (typeof raw === "number") {
      const ms = raw < 1e12 ? raw * 1000 : raw;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normalizeTime(date) {
  if (!date) return "";
  try {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

function mapTicketTailorEventRecord(record) {
  if (!record?.id && !record?.event_id) return null;

  const id = String(record.id || record.event_id);
  const startDate =
    parseDateField(record.start) ||
    parseDateField(record.start_date) ||
    parseDateField(record.start?.date) ||
    null;
  const status = String(record.status || record.state || "published").toLowerCase();

  const venue =
    record.venue?.name ||
    record.venue?.full_address ||
    record.venue_name ||
    record.location?.name ||
    "";

  return {
    id: `tt:${id}`,
    ticketTailorEventId: id,
    title: String(record.name || record.title || "TicketTailor Event").trim(),
    description: String(record.description || "").trim(),
    date: startDate,
    startTime: normalizeTime(startDate),
    endTime: "",
    venueName: String(venue).trim(),
    venueAddress: String(record.venue?.address || record.venue?.full_address || "").trim(),
    status: status.includes("draft") ? "draft" : status.includes("cancel") ? "cancelled" : "published",
    source: "ticket_tailor",
    readOnly: true,
    bookingUrl:
      record.url ||
      record.checkout_url ||
      record.public_url ||
      record.event_url ||
      "",
    ticketsAvailable: record.tickets_available ?? record.tickets_available_count ?? null,
    currency: String(record.currency || "eur").toLowerCase(),
    syncedFrom: "api",
  };
}

function mapOrderEventSummary(order) {
  const summary = order?.event_summary || order?.event || {};
  const eventId = summary.event_id || summary.id || order?.event_id;
  if (!eventId) return null;

  const startDate =
    parseDateField(summary.start_date) ||
    parseDateField(summary.date) ||
    parseDateField(summary.start) ||
    parseDateField(order?.created_at) ||
    null;

  const title =
    summary.name ||
    summary.title ||
    summary.event_name ||
    order?.event_name ||
    "TicketTailor Event";

  return {
    id: `tt:${eventId}`,
    ticketTailorEventId: String(eventId),
    title: String(title).trim(),
    description: "",
    date: startDate,
    startTime: normalizeTime(startDate),
    endTime: "",
    venueName: String(summary.venue?.name || summary.venue_name || "").trim(),
    venueAddress: String(summary.venue?.address || summary.venue?.full_address || "").trim(),
    status: "published",
    source: "ticket_tailor",
    readOnly: true,
    bookingUrl: summary.url || summary.checkout_url || order?.checkout_url || "",
    ticketsAvailable: null,
    currency: String(order?.currency || "eur").toLowerCase(),
    syncedFrom: "orders",
  };
}

async function fetchEventsPage({ startingAfter } = {}) {
  const base = env.ticketTailor.apiBase.replace(/\/$/, "");
  const url = new URL(`${base}/v1/events`);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (startingAfter) url.searchParams.set("starting_after", startingAfter);

  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(
      `Ticket Tailor API error (${res.status}) on /v1/events${body ? `: ${body.slice(0, 200)}` : ""}`
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
      nextStartingAfter = new URL(nextLink, `${base}/`).searchParams.get("starting_after");
    } catch {
      const m = /starting_after=([^&]+)/.exec(String(nextLink));
      nextStartingAfter = m?.[1] || null;
    }
  }
  return { data, nextStartingAfter };
}

async function fetchAllTicketTailorEventsFromApi() {
  const all = [];
  let startingAfter = null;
  let page = 0;

  while (page < MAX_PAGES) {
    const { data, nextStartingAfter } = await fetchEventsPage({ startingAfter });
    all.push(...data);
    page += 1;
    if (!nextStartingAfter || data.length === 0) break;
    startingAfter = nextStartingAfter;
  }

  return all.map(mapTicketTailorEventRecord).filter(Boolean);
}

async function fetchTicketTailorEventsFromPastData() {
  const docs = await PastData.find({ orderCount: { $gt: 0 } }).select("orders").lean();
  const byId = new Map();

  for (const doc of docs) {
    for (const order of doc.orders || []) {
      const mapped = mapOrderEventSummary(order);
      if (!mapped) continue;
      if (!byId.has(mapped.ticketTailorEventId)) {
        byId.set(mapped.ticketTailorEventId, mapped);
      }
    }
  }

  return [...byId.values()].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

/**
 * List TicketTailor events for admin. Tries live API first; falls back to synced order history.
 */
export async function listTicketTailorEventsForAdmin() {
  if (!isTicketTailorConfigured()) {
    return { events: [], source: "unconfigured", warning: null };
  }

  try {
    const events = await fetchAllTicketTailorEventsFromApi();
    return {
      events,
      source: "api",
      warning: null,
      total: events.length,
      published: events.filter((e) => e.status === "published").length,
    };
  } catch (error) {
    const fromOrders = await fetchTicketTailorEventsFromPastData();
    const warning =
      error.status === 403
        ? "TicketTailor events API access denied for this API key. Showing events derived from synced orders. Enable Events permission on your TicketTailor API key for full event data."
        : `Could not load live TicketTailor events (${error.message}). Showing events from synced order history.`;

    return {
      events: fromOrders,
      source: "orders",
      warning,
      total: fromOrders.length,
      published: fromOrders.length,
    };
  }
}
