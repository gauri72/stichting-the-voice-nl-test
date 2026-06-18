import env from "../config/env.js";
import Member from "../models/Member.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import { collectTicketTailorPastData } from "./pastDataSyncService.js";
import { logAdminAction } from "./adminAuditService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function pickEmail(order) {
  const buyer = order?.buyer_details || order?.buyer || order?.customer || {};
  const candidates = [buyer.email, order?.email, order?.buyer_email, order?.contact_email];
  for (const c of candidates) {
    const v = normalizeEmail(c);
    if (v && v.includes("@") && !v.includes("****")) return v;
  }
  return "";
}

function getLineItems(order) {
  const items = order?.line_items || order?.items || [];
  return Array.isArray(items) ? items : [];
}

function parseAmountMinor(order) {
  const total = order?.total || order?.total_paid || order?.amount || 0;
  const num = Number(total);
  if (!Number.isFinite(num)) return 0;
  return num < 1000 ? Math.round(num * 100) : Math.round(num);
}

function parseEventDate(order) {
  const raw =
    order?.event?.start_date ||
    order?.event?.date ||
    order?.event_date ||
    order?.created_at ||
    null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapBookingStatus(order) {
  const status = String(order?.status || order?.order_status || "confirmed").toLowerCase();
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("refund")) return "refunded";
  if (status.includes("pending")) return "pending";
  return "confirmed";
}

function isMembershipOrder(order) {
  const text = getLineItems(order)
    .map((it) => String(it?.description || it?.name || "").toLowerCase())
    .join(" ");
  return text.includes("membership") || text.includes("member");
}

/**
 * Sync Ticket Tailor orders into tickettailor_bookings collection.
 * Skips membership product orders (handled via Member records).
 */
export async function syncTicketTailorBookings({ adminId = null } = {}) {
  if (!env.ticketTailor.apiKey) {
    const err = new Error("TICKET_TAILOR_API_KEY is not configured.");
    err.status = 503;
    throw err;
  }

  const { orders } = await collectTicketTailorPastData();
  const memberEmails = new Map(
    (await Member.find({}).select("_id email").lean()).map((m) => [
      normalizeEmail(m.email),
      m._id,
    ])
  );

  let upserted = 0;
  let skipped = 0;

  for (const order of orders) {
    if (isMembershipOrder(order)) {
      skipped += 1;
      continue;
    }

    const email = pickEmail(order);
    if (!email) {
      skipped += 1;
      continue;
    }

    const orderId = String(order?.id || order?.order_id || "");
    if (!orderId) {
      skipped += 1;
      continue;
    }

    const items = getLineItems(order);
    const lines = items.length ? items : [{ description: "Ticket", quantity: 1 }];
    const memberId = memberEmails.get(email) || null;
    const eventName =
      order?.event?.name || order?.event_name || getLineItems(order)[0]?.description || "Event";
    const eventDate = parseEventDate(order);
    const bookingDate = order?.created_at ? new Date(order.created_at) : new Date();
    const amountPaidMinor = parseAmountMinor(order);
    const bookingStatus = mapBookingStatus(order);
    const checkedIn = Boolean(order?.checked_in || order?.check_in_status === "checked_in");

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const ticketType = String(line?.description || line?.name || "General Admission").trim();
      const quantity = Number(line?.quantity || 1) || 1;
      const ticketId = String(line?.id || line?.ticket_id || `${orderId}-${i}`);

      await TicketTailorBooking.findOneAndUpdate(
        { ticketTailorOrderId: orderId, ticketTailorTicketId: ticketId, ticketType },
        {
          memberId,
          email,
          eventName,
          eventDate,
          ticketType,
          quantity,
          amountPaidMinor: Math.round(amountPaidMinor / lines.length),
          currency: String(order?.currency || "eur").toLowerCase(),
          bookingStatus,
          checkedIn,
          checkedInAt: checkedIn ? bookingDate : null,
          bookingDate,
          syncedAt: new Date(),
          rawOrder: null,
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      upserted += 1;
    }
  }

  await logAdminAction({
    adminId,
    action: "tickettailor_sync_executed",
    targetType: "tickettailor",
    summary: `Synced ${upserted} TicketTailor booking lines (${skipped} skipped).`,
    detail: { upserted, skipped, orderCount: orders.length },
  });

  return { upserted, skipped, orderCount: orders.length };
}

export async function getTicketTailorStats() {
  const [bookingCount, revenueAgg, memberLinked] = await Promise.all([
    TicketTailorBooking.countDocuments({ bookingStatus: { $ne: "cancelled" } }),
    TicketTailorBooking.aggregate([
      { $match: { bookingStatus: { $in: ["confirmed", "pending"] } } },
      { $group: { _id: null, total: { $sum: "$amountPaidMinor" } } },
    ]),
    TicketTailorBooking.countDocuments({ memberId: { $ne: null } }),
  ]);

  const totalRevenueMinor = revenueAgg[0]?.total || 0;
  return {
    totalBookings: bookingCount,
    totalRevenueMinor,
    memberLinkedBookings: memberLinked,
  };
}
