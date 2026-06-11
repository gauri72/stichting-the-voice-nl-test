/**
 * Normalize legacy user documents in cluster17 so they match the current User schema.
 *
 * Fixes records migrated from the old voice_nl database that may be missing
 * passwordHash, isVerified, or authProvider, or still use legacy field names
 * (password, verified).
 *
 * Usage (from server/ or repo root via npm script):
 *   node scripts/fix-legacy-users.js            # dry run — counts only
 *   node scripts/fix-legacy-users.js --apply    # write fixes to MongoDB
 *
 * Requires in server/.env:
 *   MONGODB_URI       cluster17 connection string
 *   MONGODB_DB_NAME   optional (default: voice_nl_26)
 */
import dotenv from "dotenv";
import dns from "node:dns";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";

dotenv.config();

dns.setServers(env.dnsServers?.length ? env.dnsServers : ["8.8.8.8", "1.1.1.1"]);

const apply = process.argv.includes("--apply");
const BCRYPT_ROUNDS = 12;

function hasNonEmpty(value) {
  return Boolean(String(value ?? "").trim());
}

function resolveIsVerified(doc) {
  if (doc.isVerified === true) return true;
  if (doc.isVerified === false) return false;
  if (doc.verified === true || doc.verified === "true") return true;
  if (doc.verified === false || doc.verified === "false") return false;
  // Legacy accounts in the old system were active members — treat as verified.
  return true;
}

function resolveAuthProvider(doc) {
  if (doc.authProvider === "google" || doc.authProvider === "local") {
    return doc.authProvider;
  }
  return hasNonEmpty(doc.googleId) ? "google" : "local";
}

async function buildPasswordHash(doc, { generatePlaceholder = true } = {}) {
  if (hasNonEmpty(doc.passwordHash)) {
    return { passwordHash: String(doc.passwordHash).trim(), source: "existing" };
  }

  if (hasNonEmpty(doc.password)) {
    return { passwordHash: String(doc.password).trim(), source: "legacy-password-field" };
  }

  if (!generatePlaceholder) {
    return { passwordHash: null, source: "generated-placeholder" };
  }

  const placeholder = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS);
  return { passwordHash: placeholder, source: "generated-placeholder" };
}

async function planUserUpdate(doc, { generatePlaceholder = true } = {}) {
  const $set = {};
  const $unset = {};
  const notes = [];

  const { passwordHash, source: passwordSource } = await buildPasswordHash(doc, {
    generatePlaceholder
  });
  if (!hasNonEmpty(doc.passwordHash)) {
    if (!passwordHash && passwordSource === "generated-placeholder") {
      $set.passwordHash = "[placeholder-on-apply]";
    } else {
      $set.passwordHash = passwordHash;
    }
    notes.push(`passwordHash (${passwordSource})`);
  }

  const isVerified = resolveIsVerified(doc);
  if (doc.isVerified !== isVerified) {
    $set.isVerified = isVerified;
    notes.push(`isVerified=${isVerified}`);
  }

  const authProvider = resolveAuthProvider(doc);
  if (doc.authProvider !== authProvider) {
    $set.authProvider = authProvider;
    notes.push(`authProvider=${authProvider}`);
  }

  if (!hasNonEmpty(doc.firstName) && hasNonEmpty(doc.name)) {
    const parts = String(doc.name).trim().split(/\s+/);
    $set.firstName = (parts[0] || "Member").slice(0, 80);
    $set.lastName = parts.slice(1).join(" ").slice(0, 80);
    notes.push("firstName/lastName from name");
  }

  if (doc.password && passwordSource === "legacy-password-field") {
    $unset.password = "";
    notes.push("unset password");
  }

  if (Object.prototype.hasOwnProperty.call(doc, "verified")) {
    $unset.verified = "";
    notes.push("unset verified");
  }

  if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
    return null;
  }

  return { $set, $unset, notes };
}

async function main() {
  if (!env.mongoUri) {
    console.error("[fix-legacy-users] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  console.log(
    `[fix-legacy-users] Database: ${env.mongoDbName}  Mode: ${apply ? "APPLY" : "DRY RUN"}`
  );

  await connectDb(env.mongoUri, env.mongoDbName);

  try {
    const collection = mongoose.connection.collection("users");
    const cursor = collection.find({});
    let total = 0;
    let needsFix = 0;
    let updated = 0;
    const samples = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      total += 1;

      const plan = await planUserUpdate(doc, { generatePlaceholder: apply });
      if (!plan) continue;

      needsFix += 1;
      if (samples.length < 8) {
        samples.push(`  - ${doc.email || doc._id}: ${plan.notes.join(", ")}`);
      }

      if (!apply) continue;

      const update = {};
      if (Object.keys(plan.$set).length) update.$set = plan.$set;
      if (Object.keys(plan.$unset).length) update.$unset = plan.$unset;

      await collection.updateOne({ _id: doc._id }, update);
      updated += 1;
    }

    console.log(`[fix-legacy-users] Scanned ${total} user(s).`);
    console.log(`[fix-legacy-users] ${needsFix} user(s) need normalization.`);

    if (samples.length) {
      console.log("[fix-legacy-users] Sample changes:");
      samples.forEach((line) => console.log(line));
      if (needsFix > samples.length) {
        console.log(`  … and ${needsFix - samples.length} more`);
      }
    }

    if (apply) {
      console.log(`[fix-legacy-users] Updated ${updated} user(s).`);
      console.log(
        "[fix-legacy-users] Users with generated placeholder passwords must use Forgot password to set a new one."
      );
    } else if (needsFix > 0) {
      console.log("[fix-legacy-users] Re-run with --apply to write these changes.");
    } else {
      console.log("[fix-legacy-users] No changes required.");
    }
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch(async (error) => {
  console.error("[fix-legacy-users] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
