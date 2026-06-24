export { calculatePricePreview } from "../pricePreviewService.js";
export {
  buildOrderSummary,
  formatMoney,
  calculateVat,
  validateVoucher,
} from "../ticketPricingService.js";

import { calculatePricePreview } from "../pricePreviewService.js";

export async function calculateBookingPrice(payload = {}) {
  return calculatePricePreview(payload);
}
