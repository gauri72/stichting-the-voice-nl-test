import crypto from "crypto";
import Voucher from "../models/Voucher.js";
import Event from "../models/Event.js";
import { getNextSequence } from "../utils/sequence.js";
import { csvEscape } from "../utils/financeUtils.js";

/** Sanitizes admin-submitted eventScopes input into the schema's exact sub-document shape. */
function normalizeEventScopes(eventScopes) {
  if (!Array.isArray(eventScopes)) return [];
  return eventScopes
    .filter((s) => s && s.eventId)
    .map((s) => ({
      eventId: s.eventId,
      applyToAllTicketTypes: s.applyToAllTicketTypes !== false,
      ticketTypeIds: Array.isArray(s.ticketTypeIds) ? s.ticketTypeIds : [],
    }));
}

export function formatVoucher(v) {
  if (!v) return null;
  return {
    id: v._id?.toString() || v.id,
    name: v.name || "",
    code: v.code,
    discountType: v.discountType,
    discountValue: v.discountValue,
    usageLimit: v.usageLimit,
    usedCount: v.usedCount || 0,
    expiryDate: v.expiryDate,
    eligibleEvents: (v.eligibleEvents || []).map((id) => id.toString()),
    applyToAllEvents: Boolean(v.applyToAllEvents),
    eventScopes: (v.eventScopes || []).map((s) => ({
      eventId: s.eventId.toString(),
      applyToAllTicketTypes: s.applyToAllTicketTypes !== false,
      ticketTypeIds: (s.ticketTypeIds || []).map((id) => id.toString()),
    })),
    assignedEmail: v.assignedEmail || "",
    status: v.status,
    createdAt: v.createdAt,
  };
}

export async function listVouchers() {
  const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).lean();
  return vouchers.map(formatVoucher);
}

/** Generates an unguessable, collision-free code: prefix + monotonic sequence + random hex. */
async function generateVoucherCode(codePrefix = "") {
  const seq = await getNextSequence("voucher_code");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const prefix = String(codePrefix || "VCH").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${prefix}-${seq}-${random}`;
}

export async function createVoucher(payload, adminId) {
  const {
    code, name, discountType, discountValue, usageLimit, expiryDate,
    eligibleEvents, applyToAllEvents, eventScopes, assignedEmail, status,
  } = payload;

  if (!discountType || discountValue === undefined) {
    const err = new Error("Discount type and discount value are required.");
    err.status = 400;
    throw err;
  }

  const cleanCode = code?.trim() ? code.trim().toUpperCase() : await generateVoucherCode();
  const existing = await Voucher.findOne({ code: cleanCode }).select("_id").lean();
  if (existing) {
    const err = new Error(`Voucher code '${cleanCode}' already exists.`);
    err.status = 400;
    throw err;
  }

  const voucher = await Voucher.create({
    name: String(name || "").trim(),
    code: cleanCode,
    discountType,
    discountValue: Number(discountValue),
    usageLimit: usageLimit ? Number(usageLimit) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    eligibleEvents: Array.isArray(eligibleEvents) ? eligibleEvents : [],
    applyToAllEvents: Boolean(applyToAllEvents),
    eventScopes: normalizeEventScopes(eventScopes),
    assignedEmail: String(assignedEmail || "").toLowerCase().trim(),
    status: status || "active",
    createdBy: adminId || null,
  });

  return formatVoucher(voucher);
}

export async function updateVoucher(voucherId, payload) {
  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    const err = new Error("Voucher not found.");
    err.status = 404;
    throw err;
  }

  if (payload.code !== undefined) {
    const cleanCode = String(payload.code).trim().toUpperCase();
    if (cleanCode !== voucher.code) {
      const existing = await Voucher.findOne({ code: cleanCode }).select("_id").lean();
      if (existing) {
        const err = new Error(`Voucher code '${cleanCode}' already exists.`);
        err.status = 400;
        throw err;
      }
      voucher.code = cleanCode;
    }
  }
  if (payload.name !== undefined) voucher.name = String(payload.name || "").trim();
  if (payload.discountType !== undefined) voucher.discountType = payload.discountType;
  if (payload.discountValue !== undefined) voucher.discountValue = Number(payload.discountValue);
  if (payload.usageLimit !== undefined) voucher.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
  if (payload.expiryDate !== undefined) voucher.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
  if (payload.eligibleEvents !== undefined) voucher.eligibleEvents = payload.eligibleEvents;
  if (payload.applyToAllEvents !== undefined) voucher.applyToAllEvents = Boolean(payload.applyToAllEvents);
  if (payload.eventScopes !== undefined) voucher.eventScopes = normalizeEventScopes(payload.eventScopes);
  if (payload.assignedEmail !== undefined) voucher.assignedEmail = String(payload.assignedEmail || "").toLowerCase().trim();
  if (payload.status !== undefined) voucher.status = payload.status;

  await voucher.save();
  return formatVoucher(voucher);
}

export async function deleteVoucher(voucherId) {
  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    const err = new Error("Voucher not found.");
    err.status = 404;
    throw err;
  }
  await voucher.deleteOne();
  return { ok: true };
}

const MAX_BULK_VOUCHERS = 500;

/**
 * Generates either one voucher per assigned email (single-recipient, usageLimit: 1 each)
 * or `count` anonymous single-use vouchers when no emails are given. Always usageLimit: 1
 * per voucher regardless of mode — bulk-generated vouchers are single-use by design.
 */
export async function bulkGenerateVouchers(payload, adminId) {
  const {
    name, discountType, discountValue, expiryDate,
    applyToAllEvents, eventScopes, codePrefix,
    count, assignedEmails,
  } = payload;

  if (!discountType || discountValue === undefined) {
    const err = new Error("Discount type and discount value are required.");
    err.status = 400;
    throw err;
  }

  const emails = Array.isArray(assignedEmails)
    ? assignedEmails.map((e) => String(e || "").toLowerCase().trim()).filter(Boolean)
    : [];

  const total = emails.length > 0 ? emails.length : Number(count) || 0;
  if (total <= 0) {
    const err = new Error("Provide a count or a list of assigned emails.");
    err.status = 400;
    throw err;
  }
  if (total > MAX_BULK_VOUCHERS) {
    const err = new Error(`Cannot generate more than ${MAX_BULK_VOUCHERS} vouchers at once.`);
    err.status = 400;
    throw err;
  }

  const sharedFields = {
    name: String(name || "").trim(),
    discountType,
    discountValue: Number(discountValue),
    usageLimit: 1,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    applyToAllEvents: Boolean(applyToAllEvents),
    eventScopes: normalizeEventScopes(eventScopes),
    status: "active",
    createdBy: adminId || null,
  };

  const docs = [];
  for (let i = 0; i < total; i += 1) {
    docs.push({
      ...sharedFields,
      code: await generateVoucherCode(codePrefix),
      assignedEmail: emails[i] || "",
    });
  }

  const created = await Voucher.insertMany(docs);
  return created.map(formatVoucher);
}

function describeVoucherEvents(voucher, eventMap) {
  if (voucher.applyToAllEvents) return "All events";
  const ids = new Set([
    ...(voucher.eligibleEvents || []).map((id) => id.toString()),
    ...(voucher.eventScopes || []).map((s) => s.eventId.toString()),
  ]);
  return [...ids].map((id) => eventMap[id] || "").filter(Boolean).join("; ");
}

export async function exportVouchersCsv() {
  const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).lean();

  const eventIds = [
    ...new Set(
      vouchers.flatMap((v) => [
        ...(v.eligibleEvents || []).map((id) => id.toString()),
        ...(v.eventScopes || []).map((s) => s.eventId.toString()),
      ])
    ),
  ];
  const events = eventIds.length ? await Event.find({ _id: { $in: eventIds } }).select("title").lean() : [];
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));

  const header = "Code,Discount Type,Discount Value,Assigned Email,Status,Used,Usage Limit,Expiry Date,Assigned Events,Created At\n";
  const rows = vouchers.map((v) =>
    [
      csvEscape(v.code),
      csvEscape(v.discountType),
      csvEscape(v.discountValue),
      csvEscape(v.assignedEmail || ""),
      csvEscape(v.status),
      csvEscape(v.usedCount || 0),
      csvEscape(v.usageLimit ?? ""),
      csvEscape(v.expiryDate ? new Date(v.expiryDate).toISOString() : ""),
      csvEscape(describeVoucherEvents(v, eventMap)),
      csvEscape(v.createdAt ? new Date(v.createdAt).toISOString() : ""),
    ].join(",")
  );

  return header + rows.join("\n");
}
