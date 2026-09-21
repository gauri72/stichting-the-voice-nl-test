/**
 * Backfill TicketOrder.stripeFeeMinor for already-completed orders that predate
 * live Stripe fee capture (fulfillOrder() only captures it going forward, on
 * settlement — it never re-touches an already-fulfilled order).
 *
 * Defaults to a dry run: lists what would be written, without touching the
 * database. Pass --apply to actually write stripeFeeMinor.
 *
 * Usage:
 *   node server/scripts/backfill-ticket-order-stripe-fees.js            (dry run)
 *   node server/scripts/backfill-ticket-order-stripe-fees.js --apply    (live)
 */
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import TicketOrder from "../src/models/TicketOrder.js";
import { getStripe } from "../src/services/stripe.js";

const APPLY = process.argv.includes("--apply");

async function main() {
  await connectDb(env.mongoUri, env.mongoDbName);
  const stripe = getStripe();

  const orders = await TicketOrder.find({
    orderStatus: "COMPLETED",
    paymentIntentId: { $ne: "" },
    stripeFeeMinor: null,
  })
    .select("orderNumber paymentIntentId totalAmountMinor")
    .sort({ createdAt: 1 })
    .lean();

  console.log(`Found ${orders.length} completed order(s) with a payment intent but no captured Stripe fee.`);

  let wouldUpdate = 0;
  let skipped = 0;
  for (const order of orders) {
    let intent;
    try {
      intent = await stripe.paymentIntents.retrieve(order.paymentIntentId, {
        expand: ["latest_charge.balance_transaction"],
      });
    } catch (err) {
      console.warn(`  SKIP ${order.orderNumber} (${order.paymentIntentId}): ${err.message}`);
      skipped += 1;
      continue;
    }

    const balanceTransaction = intent.latest_charge?.balance_transaction;
    if (!balanceTransaction || typeof balanceTransaction !== "object") {
      console.warn(`  SKIP ${order.orderNumber} (${order.paymentIntentId}): no balance_transaction on the charge yet.`);
      skipped += 1;
      continue;
    }

    const feeMinor = Number(balanceTransaction.fee || 0);
    console.log(
      `  ${order.orderNumber}: gross €${(order.totalAmountMinor / 100).toFixed(2)}, fee €${(feeMinor / 100).toFixed(2)}`
    );
    wouldUpdate += 1;

    if (APPLY) {
      await TicketOrder.updateOne({ _id: order._id }, { $set: { stripeFeeMinor: feeMinor } });
    }
  }

  console.log(`\n${wouldUpdate} order(s) ${APPLY ? "updated" : "would be updated"}, ${skipped} skipped.`);
  if (!APPLY) {
    console.log("Dry run only — nothing written. Re-run with --apply to write stripeFeeMinor.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
