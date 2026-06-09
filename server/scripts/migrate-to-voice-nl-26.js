/**
 * One-time migration: copy existing data from the current (voice_nl) database
 * into the new voice_nl_26 database, renaming collections to snake_case.
 *
 * Mapping (source -> target):
 *   paymenttransactions -> payment_transactions
 *   users               -> users
 *   eventtestimonials   -> reviews
 *
 * Documents keep their original _id and are upserted, so the migration is
 * idempotent (safe to re-run; existing target docs are overwritten in place).
 *
 * Usage:
 *   node scripts/migrate-to-voice-nl-26.js            # dry run (counts only)
 *   node scripts/migrate-to-voice-nl-26.js --apply    # perform the copy
 *
 * Requires in server/.env (or shell env):
 *   SOURCE_MONGODB_URI   connection string for the OLD cluster
 *   SOURCE_DB_NAME       (optional) source database name (default: voice_nl)
 *   TARGET_MONGODB_URI   connection string for the NEW voice_nl_26 cluster
 *                        (falls back to MONGODB_URI if not set)
 *   TARGET_DB_NAME       (optional) target database name (default: voice_nl_26)
 */
import "../src/config/env.js";
import dns from "node:dns";
import mongoose from "mongoose";

// Some local resolvers refuse SRV lookups needed for mongodb+srv:// — use public DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const apply = process.argv.includes("--apply");

const SOURCE_URI = process.env.SOURCE_MONGODB_URI?.trim();
const SOURCE_DB = process.env.SOURCE_DB_NAME?.trim() || "voice_nl";
const TARGET_URI =
  process.env.TARGET_MONGODB_URI?.trim() || process.env.MONGODB_URI?.trim();
const TARGET_DB = process.env.TARGET_DB_NAME?.trim() || "voice_nl_26";

const COLLECTION_MAP = [
  { source: "paymenttransactions", target: "payment_transactions" },
  { source: "users", target: "users" },
  // Reviews historically lived in `reviews` (and/or `eventtestimonials`); copy both
  // into the new `reviews` collection. Missing/empty sources are skipped.
  { source: "reviews", target: "reviews" },
  { source: "eventtestimonials", target: "reviews" }
];

const BATCH = 500;

async function copyCollection(sourceDb, targetDb, { source, target }) {
  const srcCol = sourceDb.collection(source);
  const tgtCol = targetDb.collection(target);

  const total = await srcCol.countDocuments();
  if (total === 0) {
    console.log(`  - ${source} -> ${target}: 0 documents (nothing to copy).`);
    return { total, written: 0 };
  }

  if (!apply) {
    console.log(`  - ${source} -> ${target}: ${total} document(s) would be copied.`);
    return { total, written: 0 };
  }

  let written = 0;
  const cursor = srcCol.find({});
  let ops = [];

  const flush = async () => {
    if (ops.length === 0) return;
    const result = await tgtCol.bulkWrite(ops, { ordered: false });
    written += (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.insertedCount || 0);
    ops = [];
  };

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    ops.push({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
    });
    if (ops.length >= BATCH) await flush();
  }
  await flush();

  console.log(`  - ${source} -> ${target}: copied ${written}/${total}.`);
  return { total, written };
}

async function main() {
  if (!SOURCE_URI) {
    console.error("[migrate] SOURCE_MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }
  if (!TARGET_URI) {
    console.error("[migrate] TARGET_MONGODB_URI (or MONGODB_URI) is not set. Aborting.");
    process.exit(1);
  }

  console.log(
    `[migrate] Source: ${SOURCE_DB}  ->  Target: ${TARGET_DB}  (${apply ? "APPLY" : "DRY RUN"})`
  );

  const sourceConn = await mongoose
    .createConnection(SOURCE_URI, { dbName: SOURCE_DB, serverSelectionTimeoutMS: 8000 })
    .asPromise();
  const targetConn = await mongoose
    .createConnection(TARGET_URI, { dbName: TARGET_DB, serverSelectionTimeoutMS: 8000 })
    .asPromise();

  try {
    let grandTotal = 0;
    let grandWritten = 0;
    for (const mapping of COLLECTION_MAP) {
      const { total, written } = await copyCollection(sourceConn.db, targetConn.db, mapping);
      grandTotal += total;
      grandWritten += written;
    }
    console.log(
      apply
        ? `[migrate] Done. Wrote ${grandWritten} of ${grandTotal} document(s).`
        : `[migrate] Dry run complete. ${grandTotal} document(s) would be copied. Re-run with --apply.`
    );
  } finally {
    await sourceConn.close().catch(() => {});
    await targetConn.close().catch(() => {});
  }
}

main().catch(async (error) => {
  console.error("[migrate] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
