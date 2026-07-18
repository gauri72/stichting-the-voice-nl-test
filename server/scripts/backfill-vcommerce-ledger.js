import "dotenv/config";
import mongoose from "mongoose";
import BusinessOrder from "../src/models/BusinessOrder.js";
import BusinessPayout from "../src/models/BusinessPayout.js";
import VCommerceLedgerEntry from "../src/models/VCommerceLedgerEntry.js";

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required.");

await mongoose.connect(mongoUri);
let written = 0;

for await (const order of BusinessOrder.find({ status: { $in: ["paid", "fulfilled", "refunded"] } }).cursor()) {
  const entries = [
    ["sale", "credit", order.subtotalMinor, `Sale ${order._id}`, `order:${order._id}:sale`],
    ["fee", "debit", order.platformFeeMinor, `Platform fee for ${order._id}`, `order:${order._id}:platform-fee`],
    ["cashback", "debit", order.cashbackMinor, `Customer cashback for ${order._id}`, `order:${order._id}:cashback`],
  ];
  for (const [entryType, direction, amountMinor, description, idempotencyKey] of entries) {
    if (!amountMinor) continue;
    const result = await VCommerceLedgerEntry.updateOne(
      { idempotencyKey },
      { $setOnInsert: { businessId: order.businessId, orderId: order._id, entryType, direction, amountMinor, currency: order.currency, description, idempotencyKey } },
      { upsert: true }
    );
    written += result.upsertedCount || 0;
  }
}

for await (const payout of BusinessPayout.find({ status: "paid" }).cursor()) {
  const idempotencyKey = `payout:${payout._id}:paid`;
  const result = await VCommerceLedgerEntry.updateOne(
    { idempotencyKey },
    { $setOnInsert: { businessId: payout.businessId, payoutId: payout._id, entryType: "payout", direction: "debit", amountMinor: payout.netMinor, currency: payout.currency, description: `Payout ${payout.paymentReference || payout._id}`, idempotencyKey } },
    { upsert: true }
  );
  written += result.upsertedCount || 0;
}

console.log(`V.Commerce ledger backfill complete. ${written} entries created.`);
await mongoose.disconnect();
