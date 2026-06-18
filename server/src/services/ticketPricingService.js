import Membership from "../models/Membership.js";
import Voucher from "../models/Voucher.js";
import { resolvePlanId } from "../config/membershipPlans.js";

/** Netherlands standard VAT rate for cultural events */
export const VAT_RATE = 0.21;

const MEMBERSHIP_TICKET_DISCOUNTS = {
  student: 0,
  privilegedSingle: 10,
  privilegedFamily: 20,
  premiumSingle: 100,
  premiumFamily: 100,
};

export async function getMembershipDiscountPercent(userId) {
  if (!userId) return 0;
  const membership = await Membership.findOne({
    userId,
    active: true,
    endsAt: { $gt: new Date() },
  })
    .sort({ endsAt: -1 })
    .lean();

  if (!membership) return 0;
  const planId = resolvePlanId(membership.planId);
  return MEMBERSHIP_TICKET_DISCOUNTS[planId] ?? 0;
}

export async function validateVoucher(code, eventId) {
  if (!code?.trim()) {
    const err = new Error("Voucher code is required.");
    err.status = 400;
    throw err;
  }

  const voucher = await Voucher.findOne({
    code: code.trim().toUpperCase(),
    status: "active",
  }).lean();

  if (!voucher) {
    const err = new Error("Invalid voucher code.");
    err.status = 400;
    throw err;
  }

  if (voucher.expiryDate && new Date() > new Date(voucher.expiryDate)) {
    const err = new Error("This voucher has expired.");
    err.status = 400;
    throw err;
  }

  if (voucher.usageLimit != null && voucher.usedCount >= voucher.usageLimit) {
    const err = new Error("This voucher has reached its usage limit.");
    err.status = 400;
    throw err;
  }

  if (
    Array.isArray(voucher.eligibleEvents) &&
    voucher.eligibleEvents.length > 0 &&
    !voucher.eligibleEvents.some((id) => id.toString() === eventId.toString())
  ) {
    const err = new Error("This voucher is not valid for this event.");
    err.status = 400;
    throw err;
  }

  return voucher;
}

export function applyVoucherDiscount(subtotalMinor, voucher) {
  if (!voucher) return 0;
  if (voucher.discountType === "percentage") {
    return Math.min(subtotalMinor, Math.round(subtotalMinor * (voucher.discountValue / 100)));
  }
  return Math.min(subtotalMinor, Math.round(voucher.discountValue * 100));
}

export function applyMembershipDiscount(subtotalMinor, percent) {
  if (!percent || percent <= 0) return 0;
  return Math.min(subtotalMinor, Math.round(subtotalMinor * (percent / 100)));
}

export function calculateVat(amountMinor, vatRate = VAT_RATE) {
  // Prices are VAT-inclusive for simplicity
  const net = Math.round(amountMinor / (1 + vatRate));
  return amountMinor - net;
}

export function buildOrderSummary({
  subtotalMinor,
  bookingFeeMinor = 0,
  membershipDiscountMinor = 0,
  voucherDiscountMinor = 0,
  applyVat = true,
}) {
  const discountAmountMinor = Math.min(
    subtotalMinor,
    membershipDiscountMinor + voucherDiscountMinor
  );
  const discountedSubtotal = Math.max(0, subtotalMinor - discountAmountMinor);
  const preVatTotal = discountedSubtotal + bookingFeeMinor;
  const vatAmountMinor = applyVat ? calculateVat(preVatTotal) : 0;
  const totalAmountMinor = preVatTotal;

  return {
    subtotalMinor,
    bookingFeeMinor,
    membershipDiscountMinor,
    voucherDiscountMinor,
    discountAmountMinor,
    vatAmountMinor,
    totalAmountMinor,
  };
}

export function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number(minor) / 100
  );
}
