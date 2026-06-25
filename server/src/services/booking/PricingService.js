export { calculatePricePreview } from "../pricePreviewService.js";
export {
  buildOrderSummary,
  formatMoney,
  calculateVat,
} from "../ticketPricingService.js";

import { calculatePricePreview } from "../pricePreviewService.js";

export async function calculateBookingPrice(payload = {}) {
  return calculatePricePreview(payload);
}
