import mongoose from "mongoose";
import env from "../config/env.js";
import PastData from "../models/PastData.js";

const PAGE_LIMIT = 100;
const MAX_PAGES = 200;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isRedactedPii(value) {
  const s = String(value || "").trim();
  if (!s) return true;
  if (s === "****" || /^[\*•]+$/.test(s)) return true;
  return false;
}

function pickEmail(order) {
  const buyer = order?.buyer_details || order?.buyer || order?.customer || {};
  const candidates = [buyer.email, order?.email, order?.buyer_email, order?.contact_email];
  for (const c of candidates) {
    const v = normalizeEmail(c);
    if (v && !isRedactedPii(v) && v.includes("@")) return v;
  }
  return "";
}

function authHeader() {
  const encoded = Buffer.from(`${env.ticketTailor.apiKey}:`).toString("base64");
  return { Accept: "application/json", Authorization: `Basic ${encoded}` };
}

function parseNextStartingAfter(nextLink, base) {
  if (!nextLink) return null;
  try {
    return new URL(nextLink, `${base}/`).searchParams.get("starting_after");
  } catch {
    const m = /starting_after=([^&]+)/.exec(String(nextLink));
    return m?.[1] || null;
  }
}

async function fetchAll(path) {
  const base = env.ticketTailor.apiBase.replace(/\/$/, "");
  const all = [];
  let startingAfter = null;
  let page = 0;

  while (page < MAX_PAGES) {
    const url = new URL(`${base}${path}`);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    if (startingAfter) url.searchParams.set("starting_after", startingAfter);

    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Ticket Tailor API error (${res.status}) on ${path}${body ? `: ${body.slice(0, 200)}` : ""}`
      );
    }
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    all.push(...data);

    page += 1;
    startingAfter = parseNextStartingAfter(json?.links?.next, base);
    if (!startingAfter || data.length === 0) break;
  }

  return all;
}

function groupByEmail(orders, issuedMemberships) {
  /** @type {Map<string, { email: string, orders: object[], issuedMemberships: object[] }>} */
  const byEmail = new Map();
  const ensure = (email) => {
    if (!byEmail.has(email)) byEmail.set(email, { email, orders: [], issuedMemberships: [] });
    return byEmail.get(email);
  };

  for (const order of orders) {
    const email = pickEmail(order);
    if (email) ensure(email).orders.push(order);
  }
  for (const record of issuedMemberships) {
    const email = normalizeEmail(record?.email);
    if (email && email.includes("@")) ensure(email).issuedMemberships.push(record);
  }
  return byEmail;
}

/**
 * Fetch all Ticket Tailor orders + issued memberships and aggregate them by email.
 * Does not touch the database.
 * @returns {Promise<{ orders: object[], issuedMemberships: object[], byEmail: Map<string, {email:string, orders:object[], issuedMemberships:object[]}> }>}
 */
export async function collectTicketTailorPastData() {
  if (!env.ticketTailor.apiKey) {
    throw new Error("TICKET_TAILOR_API_KEY is not set.");
  }
  const orders = await fetchAll("/v1/orders");
  const issuedMemberships = await fetchAll("/v1/issued_memberships");
  const byEmail = groupByEmail(orders, issuedMemberships);
  return { orders, issuedMemberships, byEmail };
}

/**
 * Upsert aggregated Ticket Tailor data into the past_data collection
 * (one document per email, _id = normalized email). Requires an active
 * Mongoose connection.
 * @returns {Promise<{ orders: number, issuedMemberships: number, emails: number, written: number }>}
 */
export async function syncTicketTailorPastData() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Database is not connected.");
  }

  const { orders, issuedMemberships, byEmail } = await collectTicketTailorPastData();
  const now = new Date();

  const ops = [...byEmail.values()].map((g) => ({
    updateOne: {
      filter: { _id: g.email },
      update: {
        $set: {
          email: g.email,
          orders: g.orders,
          issuedMemberships: g.issuedMemberships,
          orderCount: g.orders.length,
          issuedMembershipCount: g.issuedMemberships.length,
          syncedAt: now
        }
      },
      upsert: true
    }
  }));

  let written = 0;
  const BATCH = 500;
  for (let i = 0; i < ops.length; i += BATCH) {
    const slice = ops.slice(i, i + BATCH);
    if (slice.length === 0) continue;
    const result = await PastData.bulkWrite(slice, { ordered: false });
    written += (result.upsertedCount || 0) + (result.modifiedCount || 0);
  }

  return {
    orders: orders.length,
    issuedMemberships: issuedMemberships.length,
    emails: byEmail.size,
    written
  };
}
