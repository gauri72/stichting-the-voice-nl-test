import TicketOrder from "../models/TicketOrder.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";

// Orders in these statuses represent tickets the customer actually ended up
// with — mirrors the "only count settled usage" choice discountService.js's
// existing per-email discount-code usage cap (countUserDiscountUsage) already
// makes, so this accepts the same small race window (a guest could open
// several concurrent pending orders before any of them pays) rather than
// inventing a stricter guarantee nothing else in the codebase has.
const SETTLED_STATUSES = ["paid", "free", "complimentary"];

/**
 * How many tickets this email has already redeemed the membership discount
 * for, for this event, across all past settled orders (guest or logged-in).
 */
export async function countDiscountedTicketsForEmail({ eventId, email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!eventId || !normalizedEmail) return 0;

  const [result] = await TicketOrder.aggregate([
    {
      $match: {
        eventId,
        attendeeEmail: normalizedEmail,
        paymentStatus: { $in: SETTLED_STATUSES },
      },
    },
    { $unwind: "$lineItems" },
    { $match: { "lineItems.memberDiscountMinor": { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$lineItems.quantity" } } },
  ]);

  return result?.total || 0;
}

/**
 * Resolves whether/how much of the membership discount an email can still
 * redeem for a given event. `remaining` is Infinity when the cap feature is
 * disabled, so callers can use Math.min(requestedQty, remaining) uniformly
 * regardless of whether the feature is on.
 */
export async function getMembershipDiscountCapStatus({ eventId, email, membershipSettings = null }) {
  const settings = membershipSettings || (await getMembershipCheckoutSettings());
  const capEnabled = settings.enableMembershipTicketDiscountCap !== false;

  if (!capEnabled) {
    return { capEnabled: false, capLimit: null, usedCount: 0, remaining: Infinity };
  }

  const capLimit = Math.max(0, Number(settings.membershipDiscountedTicketCapPerEvent) || 0);
  const usedCount = eventId && email ? await countDiscountedTicketsForEmail({ eventId, email }) : 0;
  const remaining = Math.max(0, capLimit - usedCount);

  return { capEnabled: true, capLimit, usedCount, remaining };
}
