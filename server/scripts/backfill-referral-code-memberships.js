/**
 * One-time backfill: every referral-code DiscountRule issued before this fix was created
 * with the schema default appliesTo: "tickets" (getOrIssueReferralCode() in
 * referralCodeIssuanceService.js never set it explicitly). That default has since been
 * changed to "both" for newly-issued codes, but existing codes already in the database keep
 * whatever value they were created with — this backfill updates those existing rows so
 * referral codes issued before the fix also work on membership checkout, not just new ones.
 *
 * Purely additive/corrective — only touches appliesTo on type: "referral_code" rules that
 * aren't already "both". Nothing else on the document is changed.
 *
 * Dry-run by default — prints what would change without writing anything.
 * Pass --apply to actually write.
 *
 * Usage:
 *   npm run backfill:referral-code-memberships            # dry run
 *   npm run backfill:referral-code-memberships -- --apply # real backfill
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import DiscountRule from "../src/models/DiscountRule.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

async function main() {
  await connectDb(env.mongoUri, env.mongoDbName);

  console.log(
    APPLY
      ? "Running backfill (writes will be made)..."
      : "Dry run — no writes will be made. Pass --apply to backfill for real."
  );

  const rules = await DiscountRule.find({
    type: "referral_code",
    appliesTo: { $ne: "both" },
  });

  for (const rule of rules) {
    console.log(
      `  -> ${rule._id} code=${rule.code} referrer=${rule.referrerEmail || rule.referrerUserId || "?"} ` +
        `appliesTo: "${rule.appliesTo}" -> "both"`
    );
    if (APPLY) {
      rule.appliesTo = "both";
      await rule.save();
    }
  }

  console.log(`\n${APPLY ? "Backfilled" : "Would backfill"} ${rules.length} referral code(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[backfill-referral-code-memberships] Failed:", err);
  process.exit(1);
});
