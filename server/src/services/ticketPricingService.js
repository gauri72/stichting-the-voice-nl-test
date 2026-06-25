import Voucher from "../models/Voucher.js";
import {
  applyDiscountsToOrder,
  calculateDiscountAmount,
} from "./discountService.js";

/** Netherlands standard VAT rate for cultural events */
export const VAT_RATE = 0.21;

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
  referralDiscountMinor = 0,
  personalDiscountMinor = 0,
  applyVat = true,
}) {
  const codeDiscountMinor = voucherDiscountMinor + referralDiscountMinor + personalDiscountMinor;
  const discountAmountMinor = Math.min(
    subtotalMinor,
    membershipDiscountMinor + codeDiscountMinor
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
    referralDiscountMinor,
    personalDiscountMinor,
    discountAmountMinor,
    vatAmountMinor,
    totalAmountMinor,
  };
}

export { applyDiscountsToOrder, calculateDiscountAmount };

export function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number(minor) / 100
  );
}
