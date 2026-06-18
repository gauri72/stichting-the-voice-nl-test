import env from "../config/env.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import { isTicketTailorConfigured } from "./ticketTailorService.js";
import { listTicketTailorEventsForAdmin } from "./ticketTailorEventService.js";
import { formatMoney } from "./ticketPricingService.js";

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const CACHE_TTL_MS = 90_000;

let issuedTicketCache = { at: 0, tickets: [], source: null, warning: null };

function authHeader() {
  const encoded = Buffer.from(`${env.ticketTailor.apiKey}:`).toString("base64");
  return { Accept: "application/json", Authorization: `Basic ${encoded}` };
}

function parseUnixDate(value) {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const ms = num < 1e12 ? num * 1000 : num;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCheckedIn(value) {
  if (value === true || value === "true") return true;
  return false;
}

function mapPaymentStatus(status) {
  const s = String(status || "valid").toLowerCase();
  if (s.includes("void") || s.includes("refund") || s.includes("cancel")) return "refunded";
  if (s.includes("pending")) return "pending";
  return "paid";
}

function mapTicketStatus(status) {
  const s = String(status || "valid").toLowerCase();
  if (s.includes("void") || s.includes("cancel")) return "cancelled";
  if (s.includes("refund")) return "refunded";
  return "valid";
}

async function buildEventNameMap() {
  const { events } = await listTicketTailorEventsForAdmin();
  const map = new Map();
  for (const event of events) {
    if (event.ticketTailorEventId) map.set(event.ticketTailorEventId, event.title);
  }
  return map;
}

function mapIssuedTicketRecord(record, eventNames) {
  if (!record?.id) return null;

  const eventId = String(record.event_id || "");
  const eventTitle = eventNames.get(eventId) || (eventId ? `Event ${eventId}` : "TicketTailor Event");
  const createdAt = parseUnixDate(record.created_at);

  return {
    id: `tt:${record.id}`,
    ticketNumber: String(record.barcode || record.id),
    attendeeName: String(record.full_name || `${record.first_name || ""} ${record.last_name || ""}`).trim(),
    attendeeEmail: String(record.email || "").trim().toLowerCase(),
    eventId: eventId ? `tt:${eventId}` : "",
    eventTitle,
    ticketTypeName: String(record.description || "Ticket").trim(),
    status: mapTicketStatus(record.status),
    checkedIn: parseCheckedIn(record.checked_in),
    checkedInAt: parseCheckedIn(record.checked_in) ? createdAt : null,
    createdAt,
    source: "ticket_tailor",
    readOnly: true,
    order: {
      orderNumber: String(record.order_id || ""),
      paymentStatus: mapPaymentStatus(record.status),
    },
    ticketTailor: {
      issuedTicketId: String(record.id),
      orderId: String(record.order_id || ""),
      eventId,
      ticketTypeId: String(record.ticket_type_id || ""),
      barcode: String(record.barcode || ""),
      barcodeUrl: record.barcode_url || "",
      qrCodeUrl: record.qr_code_url || "",
      listedPriceMinor: Number(record.listed_price) || 0,
      currency: String(record.listed_currency?.code || "eur").toLowerCase(),
      syncedFrom: "api",
    },
  };
}

function mapBookingRecord(booking) {
  if (!booking?._id) return null;

  return {
    id: `tt:booking:${booking._id}`,
    ticketNumber: String(booking.ticketTailorTicketId || booking.ticketTailorOrderId),
    attendeeName: booking.email,
    attendeeEmail: booking.email,
    eventId: "",
    eventTitle: String(booking.eventName || "TicketTailor Event").trim(),
    ticketTypeName: String(booking.ticketType || "Ticket").trim(),
    status: booking.bookingStatus === "refunded" ? "refunded" : booking.bookingStatus === "cancelled" ? "cancelled" : "valid",
    checkedIn: Boolean(booking.checkedIn),
    checkedInAt: booking.checkedInAt || null,
    createdAt: booking.bookingDate || booking.createdAt,
    source: "ticket_tailor",
    readOnly: true,
    order: {
      orderNumber: String(booking.ticketTailorOrderId || ""),
      paymentStatus:
        booking.bookingStatus === "refunded"
          ? "refunded"
          : booking.bookingStatus === "pending"
            ? "pending"
            : "paid",
    },
    ticketTailor: {
      issuedTicketId: String(booking.ticketTailorTicketId || ""),
      orderId: String(booking.ticketTailorOrderId || ""),
      eventId: "",
      ticketTypeId: "",
      barcode: "",
      barcodeUrl: "",
      qrCodeUrl: "",
      listedPriceMinor: Number(booking.amountPaidMinor) || 0,
      currency: String(booking.currency || "eur").toLowerCase(),
      syncedFrom: "bookings",
    },
  };
}

async function fetchIssuedTicketsPage({ startingAfter } = {}) {
  const base = env.ticketTailor.apiBase.replace(/\/$/, "");
  const url = new URL(`${base}/v1/issued_tickets`);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (startingAfter) url.searchParams.set("starting_after", startingAfter);

  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(
      `Ticket Tailor API error (${res.status}) on /v1/issued_tickets${body ? `: ${body.slice(0, 200)}` : ""}`
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

async function fetchAllIssuedTicketsFromApi() {
  const now = Date.now();
  if (issuedTicketCache.tickets.length && now - issuedTicketCache.at < CACHE_TTL_MS) {
    return {
      tickets: issuedTicketCache.tickets,
      source: issuedTicketCache.source,
      warning: issuedTicketCache.warning,
    };
  }

  const eventNames = await buildEventNameMap();
  const all = [];
  let startingAfter = null;
  let page = 0;

  while (page < MAX_PAGES) {
    const { data, nextStartingAfter } = await fetchIssuedTicketsPage({ startingAfter });
    all.push(...data.map((r) => mapIssuedTicketRecord(r, eventNames)).filter(Boolean));
    page += 1;
    if (!nextStartingAfter || data.length === 0) break;
    startingAfter = nextStartingAfter;
  }

  all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  issuedTicketCache = {
    at: now,
    tickets: all,
    source: "api",
    warning: null,
  };

  return { tickets: all, source: "api", warning: null };
}

async function fetchTicketsFromBookings() {
  const bookings = await TicketTailorBooking.find({})
    .sort({ bookingDate: -1, createdAt: -1 })
    .limit(5000)
    .lean();

  const tickets = bookings.map(mapBookingRecord).filter(Boolean);
  return { tickets, source: "bookings", warning: null };
}

function applyFilters(tickets, filters = {}) {
  const { search, eventId, paymentStatus, checkedIn, limit = 200 } = filters;
  let rows = tickets;

  if (eventId && !eventId.startsWith("tt:")) {
    return { tickets: [], total: 0 };
  }
  if (eventId?.startsWith("tt:")) {
    const ttEventId = eventId.slice(3);
    rows = rows.filter((t) => t.eventId === eventId || t.ticketTailor?.eventId === ttEventId);
  }

  if (paymentStatus) {
    rows = rows.filter((t) => t.order?.paymentStatus === paymentStatus);
  }

  if (checkedIn === "true") rows = rows.filter((t) => t.checkedIn);
  if (checkedIn === "false") rows = rows.filter((t) => !t.checkedIn);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((t) => {
      const haystack = [
        t.ticketNumber,
        t.attendeeName,
        t.attendeeEmail,
        t.eventTitle,
        t.ticketTypeName,
        t.order?.orderNumber,
        t.ticketTailor?.issuedTicketId,
        t.ticketTailor?.barcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const total = rows.length;
  const capped = rows.slice(0, Math.min(Number(limit) || 200, 500));

  return { tickets: capped, total };
}

export async function listTicketTailorTicketsForAdmin(filters = {}) {
  if (!isTicketTailorConfigured()) {
    return {
      tickets: [],
      source: "unconfigured",
      warning: null,
      total: 0,
      checkedIn: 0,
      revenueMinor: 0,
    };
  }

  try {
    const { tickets, source, warning } = await fetchAllIssuedTicketsFromApi();
    const filtered = applyFilters(tickets, filters);
    const checkedIn = tickets.filter((t) => t.checkedIn).length;
    const revenueMinor = tickets.reduce((sum, t) => sum + (t.ticketTailor?.listedPriceMinor || 0), 0);

    return {
      ...filtered,
      source,
      warning,
      checkedIn,
      revenueMinor,
      revenue: formatMoney(revenueMinor),
    };
  } catch (error) {
    const fromBookings = await fetchTicketsFromBookings();
    const warning =
      error.status === 403
        ? "TicketTailor issued tickets API access denied for this API key. Showing synced booking lines instead. Enable Issued Tickets permission on your TicketTailor API key."
        : `Could not load live TicketTailor issued tickets (${error.message}). Showing synced booking lines.`;

    const filtered = applyFilters(fromBookings.tickets, filters);
    const checkedIn = fromBookings.tickets.filter((t) => t.checkedIn).length;
    const revenueMinor = fromBookings.tickets.reduce(
      (sum, t) => sum + (t.ticketTailor?.listedPriceMinor || 0),
      0
    );

    return {
      ...filtered,
      source: "bookings",
      warning,
      checkedIn,
      revenueMinor,
      revenue: formatMoney(revenueMinor),
    };
  }
}

export async function getTicketTailorTicketStats() {
  if (!isTicketTailorConfigured()) {
    return {
      totalTickets: 0,
      ticketsCheckedIn: 0,
      totalRevenue: formatMoney(0),
      totalRevenueMinor: 0,
      refundedTickets: 0,
      source: "unconfigured",
      warning: null,
    };
  }

  try {
    const { tickets, source, warning } = await fetchAllIssuedTicketsFromApi();
  return buildTicketTailorStats(tickets, source, warning);
  } catch (error) {
    const fromBookings = await fetchTicketsFromBookings();
    const warning =
      error.status === 403
        ? "TicketTailor issued tickets API access denied for this API key."
        : `Could not load live TicketTailor issued tickets (${error.message}).`;
    return buildTicketTailorStats(fromBookings.tickets, "bookings", warning);
  }
}

function buildTicketTailorStats(tickets, source, warning) {
  const revenueMinor = tickets.reduce((sum, t) => sum + (t.ticketTailor?.listedPriceMinor || 0), 0);
  return {
    totalTickets: tickets.length,
    ticketsCheckedIn: tickets.filter((t) => t.checkedIn).length,
    totalRevenue: formatMoney(revenueMinor),
    totalRevenueMinor: revenueMinor,
    refundedTickets: tickets.filter((t) => t.status === "refunded").length,
    source,
    warning,
  };
}
