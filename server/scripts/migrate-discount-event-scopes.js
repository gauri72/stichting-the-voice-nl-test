/**
 * One-time migration: populates the new applyToAllEvents/eventScopes fields on every
 * existing DiscountRule and Voucher document from their legacy eligibleEventIds/
 * eligibleEvents arrays, so the admin UI (Phase B) has consistent data to display
 * immediately instead of relying solely on appliesToEventAndTicketType()'s runtime
 * fallback (discountService.js).
 *
 * For each document:
 *   - legacy array empty/missing  -> applyToAllEvents: true,  eventScopes: []
 *   - legacy array populated      -> applyToAllEvents: false, eventScopes: one entry per
 *                                     event id, applyToAllTicketTypes: true, ticketTypeIds: []
 *     (matches today's behavior exactly: no per-ticket-type restriction existed before
 *     this work, so every migrated scope starts as "all ticket types of this event")
 *
 * Purely additive — the legacy array is left untouched, nothing is deleted.
 *
 * Dry-run by default — prints what would change without writing anything.
 * Pass --apply to actually write the new fields.
 *
 * Usage:
 *   npm run migrate:discount-event-scopes            # dry run
 *   npm run migrate:discount-event-scopes -- --apply # real migration
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import DiscountRule from "../src/models/DiscountRule.js";
import Voucher from "../src/models/Voucher.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

async function migrateCollection(Model, legacyField, label) {
  // $size: 0 alone would miss every pre-existing document, since the field is entirely
  // absent on documents created before this migration's schema change (not present as []).
  const docs = await Model.find({
    $or: [{ eventScopes: { $exists: false } }, { eventScopes: { $size: 0 } }],
  });
  let migrated = 0;

  for (const doc of docs) {
    const legacyIds = doc[legacyField] || [];

    if (legacyIds.length === 0) {
      console.log(`  -> [${label}] ${doc._id} "${doc.name || doc.code}": all events (no legacy ids)`);
      if (APPLY) {
        doc.applyToAllEvents = true;
        await doc.save();
      }
      migrated += 1;
      continue;
    }

    console.log(`  -> [${label}] ${doc._id} "${doc.name || doc.code}": ${legacyIds.length} event(s) -> eventScopes`);
    if (APPLY) {
      doc.applyToAllEvents = false;
      doc.eventScopes = legacyIds.map((eventId) => ({
        eventId,
        applyToAllTicketTypes: true,
        ticketTypeIds: [],
      }));
      await doc.save();
    }
    migrated += 1;
  }

  return migrated;
}

async function main() {
  await connectDb(env.mongoUri, env.mongoDbName);

  console.log(
    APPLY
      ? "Running migration (writes will be made)..."
      : "Dry run — no writes will be made. Pass --apply to migrate for real."
  );

  const ruleCount = await migrateCollection(DiscountRule, "eligibleEventIds", "DiscountRule");
  const voucherCount = await migrateCollection(Voucher, "eligibleEvents", "Voucher");

  console.log(
    `\n${APPLY ? "Migrated" : "Would migrate"} ${ruleCount} DiscountRule(s) and ${voucherCount} Voucher(s).`
  );
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate-discount-event-scopes] Failed:", err);
  process.exit(1);
});
