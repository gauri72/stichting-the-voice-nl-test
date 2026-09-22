import mongoose from "mongoose";
import TicketOrder from "../models/TicketOrder.js";
import User from "../models/User.js";

// Orders in these statuses represent tickets the customer actually ended up with —
// mirrors membershipTicketCapService.js's SETTLED_STATUSES.
const SETTLED_STATUSES = ["paid", "free", "complimentary"];

export const PER_ACCOUNT_EVENT_TICKET_CAP = 10;

/**
 * Total tickets already purchased for this event under this identity, across all
 * past settled orders — matched by account (userId), the account's own registered
 * email (covers guest orders placed before the account existed/was linked — same
 * reasoning as ticketOrderService.js's ownedOrdersFilter), and the attendee email
 * used on this checkout. Matching on email as well as userId means logging out to
 * check out as a guest under the same email doesn't route around the cap.
 */
export async function countTicketsForAccountAndEvent({ eventId, userId, email }) {
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) return 0;

  const emails = new Set();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail) emails.add(normalizedEmail);

  const identityOr = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    identityOr.push({ userId: new mongoose.Types.ObjectId(userId) });
    const account = await User.findById(userId).select("email").lean();
    if (account?.email) emails.add(account.email.toLowerCase());
  }
  emails.forEach((e) => identityOr.push({ attendeeEmail: e }));

  if (!identityOr.length) return 0;

  const [result] = await TicketOrder.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
        paymentStatus: { $in: SETTLED_STATUSES },
        $or: identityOr,
      },
    },
    { $unwind: "$lineItems" },
    { $group: { _id: null, total: { $sum: "$lineItems.quantity" } } },
  ]);

  return result?.total || 0;
}

/**
 * Throws when adding `requestedQty` more tickets for this event/identity would
 * exceed PER_ACCOUNT_EVENT_TICKET_CAP. Silently no-ops when there's no identity
 * to check against yet (e.g. a price preview requested before an email is entered) —
 * the real gate is at order creation, where attendeeEmail is always required.
 */
export async function assertUnderAccountEventTicketCap({ eventId, userId, email, requestedQty }) {
  if (!userId && !String(email || "").trim()) return;

  const existing = await countTicketsForAccountAndEvent({ eventId, userId, email });
  if (existing + requestedQty <= PER_ACCOUNT_EVENT_TICKET_CAP) return;

  const remaining = Math.max(0, PER_ACCOUNT_EVENT_TICKET_CAP - existing);
  const err = new Error(
    remaining > 0
      ? `You can have at most ${PER_ACCOUNT_EVENT_TICKET_CAP} tickets for this event per account — you already have ${existing}, so you can add ${remaining} more.`
      : `You've already reached the limit of ${PER_ACCOUNT_EVENT_TICKET_CAP} tickets for this event per account.`
  );
  err.status = 400;
  throw err;
}
