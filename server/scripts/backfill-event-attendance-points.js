// One-time retroactive backfill: award the per-event loyalty points bonus
// (WalletGlobalSettings.pointsPerEventAttended) for every distinct event a
// customer has already attended — both platform orders and Ticket Tailor
// history — so members aren't penalized for having attended before this
// feature existed. Safe to re-run: awardEventAttendancePoints() is
// idempotent per (customerId, referenceId) via the eventAttendance
// WalletTransaction reference, so already-awarded pairs are just skipped.
import "dotenv/config";
import mongoose from "mongoose";
import { SETTLED_PAYMENT_STATUSES } from "../src/utils/orderPaymentUtils.js";
import { awardEventAttendancePoints, ticketTailorEventReferenceId } from "../src/services/walletService.js";
import { isTicketTailorConfigured, loadTicketTailorAccountData, splitOrdersByCategory } from "../src/services/ticketTailorService.js";

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || "voice_nl_26" });
const db = mongoose.connection.db;

console.log("--- Step 1: platform orders ---");
const pairs = await db
  .collection("ticket_orders")
  .aggregate([
    { $match: { userId: { $ne: null }, eventId: { $ne: null }, paymentStatus: { $in: SETTLED_PAYMENT_STATUSES } } },
    { $group: { _id: { userId: "$userId", eventId: "$eventId" } } },
  ])
  .toArray();

console.log(`Found ${pairs.length} distinct (customer, event) pairs to backfill.`);

let awarded = 0;
let skipped = 0;
for (const { _id } of pairs) {
  const event = await db.collection("events").findOne({ _id: _id.eventId }, { projection: { title: 1 } });
  const result = await awardEventAttendancePoints(_id.userId.toString(), _id.eventId.toString(), event?.title);
  if (result) {
    awarded += 1;
    console.log(`  awarded — customer ${_id.userId} / event "${event?.title || _id.eventId}"`);
  } else {
    skipped += 1;
  }
}
console.log(`Platform orders done. Awarded: ${awarded}, skipped: ${skipped}.`);

console.log("--- Step 2: Ticket Tailor history (one live API call per user — will take a while) ---");
let ttAwarded = 0;
let ttSkipped = 0;
let ttUsersChecked = 0;
let ttUsersWithHistory = 0;

if (isTicketTailorConfigured()) {
  const users = await db
    .collection("users")
    .find({ isVerified: true, email: { $exists: true, $ne: "" } }, { projection: { email: 1 } })
    .toArray();
  console.log(`Checking ${users.length} registered users against Ticket Tailor...`);

  for (const user of users) {
    ttUsersChecked += 1;
    try {
      const { orders } = await loadTicketTailorAccountData(user.email);
      const { events: ttEventOrders } = splitOrdersByCategory(orders || []);
      if (!ttEventOrders.length) continue;
      ttUsersWithHistory += 1;

      const titles = new Set(ttEventOrders.map((o) => o.eventTitle || "Event (Ticket Tailor)"));
      for (const title of titles) {
        const result = await awardEventAttendancePoints(user._id.toString(), ticketTailorEventReferenceId(title), title);
        if (result) ttAwarded += 1;
        else ttSkipped += 1;
      }
    } catch (err) {
      console.warn(`  TT lookup failed for ${user.email}:`, err.message);
    }
    if (ttUsersChecked % 25 === 0) {
      console.log(`  ...${ttUsersChecked}/${users.length} users checked (${ttUsersWithHistory} with TT history so far)`);
    }
  }
  console.log(`Ticket Tailor done. Users checked: ${ttUsersChecked}, with history: ${ttUsersWithHistory}, awarded: ${ttAwarded}, skipped: ${ttSkipped}.`);
} else {
  console.log("Ticket Tailor is not configured in this environment — skipping step 2.");
}

console.log("--- Backfill complete ---");
console.log({ platformAwarded: awarded, platformSkipped: skipped, ttAwarded, ttSkipped, ttUsersChecked, ttUsersWithHistory });

await mongoose.disconnect();
process.exit(0);
