/**
 * Set kind = "membership" for PaymentTransaction records whose tierName is one of
 * the membership tiers below. Matches tierName case-insensitively (trimmed).
 *
 * Usage:
 *   node server/scripts/fix-membership-kind.js            # dry run (no writes)
 *   node server/scripts/fix-membership-kind.js --apply    # apply the update
 *
 * Requires MONGODB_URI in server/.env.
 */
import "../src/config/env.js";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import PaymentTransaction from "../src/models/PaymentTransaction.js";

const TIER_NAMES = [
  "Student",
  "Privileged Single",
  "Privileged Family",
  "Premium Single",
  "Premium Family"
];

const apply = process.argv.includes("--apply");

function nameRegex(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}\\s*$`, "i");
}

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("[fix:membership-kind] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  await connectDb(env.mongoUri);

  const filter = {
    tierName: { $in: TIER_NAMES.map(nameRegex) },
    kind: { $ne: "membership" }
  };

  const matches = await PaymentTransaction.find(filter)
    .select("paymentIntentId tierName kind")
    .lean();

  console.log(
    `[fix:membership-kind] ${matches.length} record(s) need kind -> "membership".`
  );
  for (const m of matches) {
    console.log(
      `  - ${m.paymentIntentId} | tierName="${m.tierName}" | kind="${m.kind}" -> "membership"`
    );
  }

  if (!apply) {
    console.log(
      "[fix:membership-kind] Dry run only. Re-run with --apply to write changes."
    );
    await mongoose.disconnect();
    return;
  }

  if (matches.length === 0) {
    console.log("[fix:membership-kind] Nothing to update.");
    await mongoose.disconnect();
    return;
  }

  const result = await PaymentTransaction.updateMany(filter, {
    $set: { kind: "membership" }
  });
  console.log(
    `[fix:membership-kind] Updated ${result.modifiedCount} record(s).`
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[fix:membership-kind] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
