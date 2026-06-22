/**
 * Backfill sponsorships and donations collections from payment_transactions.
 *
 * Usage: node server/scripts/backfill-sponsorships-donations.js
 */
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { backfillFromPaymentTransactions } from "../src/services/sponsorshipDonationRecordService.js";

async function main() {
  await mongoose.connect(env.mongoUri);
  const result = await backfillFromPaymentTransactions();
  console.log("Backfill complete:", result);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
