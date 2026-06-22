/**
 * Archives legacy DiscountCode records (e.g. Couples Night / 10off) so they no longer
 * appear on the member dashboard but remain visible in Admin → Discounts (Legacy filter).
 *
 * Usage: node server/scripts/archive-legacy-discount-codes.js
 */
import mongoose from "mongoose";
import env from "../src/config/env.js";
import DiscountCode from "../src/models/DiscountCode.js";

async function main() {
  await mongoose.connect(env.mongoUri);
  const now = new Date();

  const records = await DiscountCode.find({
    deletedAt: null,
    $or: [
      { name: /couples night/i },
      { code: /10off/i },
      { showOnDashboard: { $exists: false } },
      { status: { $exists: false } },
    ],
  });

  let archived = 0;
  for (const record of records) {
    const isCouplesNight =
      /couples night/i.test(record.name || "") || /10off/i.test(record.code || "");

    if (isCouplesNight || record.showOnDashboard !== false) {
      record.status = "archived";
      record.archivedAt = now;
      record.showOnDashboard = false;
      record.visibleToUsers = false;
      record.source = record.source || "legacy";
      await record.save();
      archived += 1;
      console.log(`[LEGACY_DISCOUNT_FOUND] archived name=${record.name} code=${record.code}`);
    }
  }

  console.log(`Archived ${archived} legacy discount code(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
