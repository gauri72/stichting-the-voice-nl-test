/**
 * Backfill V.O.I.C.E. NL accounts for people who bought tickets earlier this
 * year (2026-01-01 through today) but never created an account.
 *
 * Defaults to a dry run: lists the unique, not-yet-existing emails that would
 * get an account + claim email, without touching the database or sending
 * anything. Pass --apply to actually provision + email them.
 *
 * Excludes admin-issued and complimentary/VIP orders, matching the live
 * ticket-purchase provisioning hook in postPaymentFulfillmentService.js.
 *
 * Usage:
 *   node server/scripts/backfill-ticket-buyer-accounts.js            (dry run)
 *   node server/scripts/backfill-ticket-buyer-accounts.js --apply    (live)
 */
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import TicketOrder from "../src/models/TicketOrder.js";
import User from "../src/models/User.js";
import { ensureUserForEmail } from "../src/services/userProvisioningService.js";

const APPLY = process.argv.includes("--apply");
const YEAR_START = new Date("2026-01-01T00:00:00.000Z");

async function main() {
  await connectDb(env.mongoUri, env.mongoDbName);

  const orders = await TicketOrder.find({
    orderStatus: "COMPLETED",
    adminIssued: { $ne: true },
    paymentStatus: { $ne: "complimentary" },
    createdAt: { $gte: YEAR_START, $lte: new Date() },
  })
    .select("attendeeEmail attendeeFirstName attendeeLastName attendeePhone createdAt")
    .sort({ createdAt: 1 })
    .lean();

  // First order per email wins for name/phone (earliest purchase).
  const byEmail = new Map();
  for (const order of orders) {
    const email = String(order.attendeeEmail || "").trim().toLowerCase();
    if (!email || byEmail.has(email)) continue;
    byEmail.set(email, {
      email,
      firstName: order.attendeeFirstName,
      lastName: order.attendeeLastName,
      phone: order.attendeePhone || "",
      firstPurchaseAt: order.createdAt,
    });
  }

  console.log(`Scanned ${orders.length} completed ticket orders since ${YEAR_START.toISOString().slice(0, 10)}.`);
  console.log(`Found ${byEmail.size} unique attendee emails.`);

  const existingEmails = new Set(
    (await User.find({ email: { $in: [...byEmail.keys()] } }).select("email").lean()).map((u) => u.email)
  );

  const toProvision = [...byEmail.values()].filter((r) => !existingEmails.has(r.email));

  console.log(`${existingEmails.size} already have an account.`);
  console.log(`${toProvision.length} unique emails have NO account and would be provisioned:\n`);
  for (const r of toProvision) {
    console.log(`  ${r.email}  —  ${r.firstName} ${r.lastName}  (first ticket: ${r.firstPurchaseAt.toISOString().slice(0, 10)})`);
  }

  if (!APPLY) {
    console.log("\nDry run only — no accounts created, no emails sent. Re-run with --apply to go live.");
    await mongoose.disconnect();
    return;
  }

  console.log("\n--apply passed — provisioning accounts and sending claim emails now...");
  let created = 0;
  for (const r of toProvision) {
    const result = await ensureUserForEmail(
      r.email,
      { firstName: r.firstName, lastName: r.lastName, phone: r.phone },
      "ticket_purchase"
    );
    if (result.created) created += 1;
  }
  console.log(`Done. Created ${created} accounts.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
