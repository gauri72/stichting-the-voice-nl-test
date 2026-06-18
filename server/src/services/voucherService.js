import Voucher from "../models/Voucher.js";

export function formatVoucher(v) {
  if (!v) return null;
  return {
    id: v._id?.toString() || v.id,
    code: v.code,
    discountType: v.discountType,
    discountValue: v.discountValue,
    usageLimit: v.usageLimit,
    usedCount: v.usedCount || 0,
    expiryDate: v.expiryDate,
    eligibleEvents: (v.eligibleEvents || []).map((id) => id.toString()),
    status: v.status,
    createdAt: v.createdAt,
  };
}

export async function listVouchers() {
  const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).lean();
  return vouchers.map(formatVoucher);
}

export async function createVoucher(payload, adminId) {
  const { code, discountType, discountValue, usageLimit, expiryDate, eligibleEvents, status } =
    payload;

  if (!code?.trim() || !discountType || discountValue === undefined) {
    const err = new Error("Code, discount type, and discount value are required.");
    err.status = 400;
    throw err;
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await Voucher.findOne({ code: cleanCode }).select("_id").lean();
  if (existing) {
    const err = new Error(`Voucher code '${cleanCode}' already exists.`);
    err.status = 400;
    throw err;
  }

  const voucher = await Voucher.create({
    code: cleanCode,
    discountType,
    discountValue: Number(discountValue),
    usageLimit: usageLimit ? Number(usageLimit) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    eligibleEvents: Array.isArray(eligibleEvents) ? eligibleEvents : [],
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
  if (payload.discountType !== undefined) voucher.discountType = payload.discountType;
  if (payload.discountValue !== undefined) voucher.discountValue = Number(payload.discountValue);
  if (payload.usageLimit !== undefined) voucher.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
  if (payload.expiryDate !== undefined) voucher.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
  if (payload.eligibleEvents !== undefined) voucher.eligibleEvents = payload.eligibleEvents;
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
