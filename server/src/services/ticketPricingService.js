import {
  applyDiscountsToOrder,
  calculateDiscountAmount,
} from "./discountService.js";

/** Netherlands standard VAT rate for cultural events */
export const VAT_RATE = 0.21;

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
