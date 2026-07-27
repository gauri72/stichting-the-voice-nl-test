/**
 * Recomputes ReferralReward.rewardValue for pending/approved rows created before the
 * rewardValue bug fix — it was stored as the raw, un-computed DiscountRule.rewardValue
 * (e.g. a literal 10 for a 10%-type reward) instead of the actual computed amount in
 * minor units. The correct amount already exists on the linked DiscountUsage.rewardAmount
 * (recordDiscountUsage always wrote it there correctly), so this just copies it across.
 * Only touches pending/approved rewards — paid/cancelled ones are historical and left
 * alone (a "paid" reward already represents money that moved based on the old number;
 * silently changing what it says it paid would be more confusing than useful).
 *
 * Usage:
 *   node server/scripts/fix-referral-reward-values.js            # dry run (no writes)
 *   node server/scripts/fix-referral-reward-values.js --apply    # apply the update
 *
 * Requires MONGODB_URI in server/.env.
 */
import "../src/config/env.js";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import ReferralReward from "../src/models/ReferralReward.js";
import DiscountUsage from "../src/models/DiscountUsage.js";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("[fix:referral-reward-values] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  await connectDb(env.mongoUri);

  const rewards = await ReferralReward.find({
    rewardStatus: { $in: ["pending", "approved"] },
  }).lean();

  const toFix = [];
  for (const reward of rewards) {
    if (!reward.orderId) continue;
    const usage = await DiscountUsage.findOne({
      discountId: reward.discountId,
      orderId: reward.orderId,
    })
      .select("rewardAmount")
      .lean();
    if (!usage || usage.rewardAmount == null) continue;
    if (usage.rewardAmount === reward.rewardValue) continue; // already correct
    toFix.push({ id: reward._id, from: reward.rewardValue, to: usage.rewardAmount });
  }

  console.log(`[fix:referral-reward-values] ${toFix.length} record(s) need rewardValue corrected.`);
  for (const f of toFix) {
    console.log(`  - ${f.id} | rewardValue ${f.from} -> ${f.to}`);
  }

  if (!apply) {
    console.log("[fix:referral-reward-values] Dry run only. Re-run with --apply to write changes.");
    await mongoose.disconnect();
    return;
  }

  if (toFix.length === 0) {
    console.log("[fix:referral-reward-values] Nothing to update.");
    await mongoose.disconnect();
    return;
  }

  for (const f of toFix) {
    await ReferralReward.updateOne({ _id: f.id }, { $set: { rewardValue: f.to } });
  }
  console.log(`[fix:referral-reward-values] Updated ${toFix.length} record(s).`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[fix:referral-reward-values] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
