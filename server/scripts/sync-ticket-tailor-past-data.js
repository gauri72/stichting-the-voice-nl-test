/**
 * Pull ALL Ticket Tailor orders + issued memberships and store them in the
 * `past_data` collection of voice_nl_26, aggregated one document per buyer email
 * (_id = normalized email). Re-running upserts (no duplicates).
 *
 * Usage:
 *   node scripts/sync-ticket-tailor-past-data.js            # dry run (no writes)
 *   node scripts/sync-ticket-tailor-past-data.js --apply    # write to past_data
 *
 * Requires in server/.env:
 *   MONGODB_URI            connection string for the voice_nl_26 cluster
 *   MONGODB_DB_NAME        (optional) defaults to voice_nl_26
 *   TICKET_TAILOR_API_KEY  Ticket Tailor API key with buyer emails visible
 */
import "../src/config/env.js";
import dns from "node:dns";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import {
  collectTicketTailorPastData,
  syncTicketTailorPastData
} from "../src/services/pastDataSyncService.js";

// Some local resolvers refuse SRV lookups needed for mongodb+srv:// — use public DNS.
dns.setServers(env.dnsServers.length ? env.dnsServers : ["8.8.8.8", "1.1.1.1"]);

const apply = process.argv.includes("--apply");

async function main() {
  if (!env.ticketTailor.apiKey) {
    console.error("[sync:past-data] TICKET_TAILOR_API_KEY is not set. Aborting.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("[sync:past-data] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  if (!apply) {
    console.log("[sync:past-data] Fetching Ticket Tailor data (dry run)...");
    const { orders, issuedMemberships, byEmail } = await collectTicketTailorPastData();
    console.log(
      `[sync:past-data] ${orders.length} order(s), ${issuedMemberships.length} issued membership(s), ` +
        `${byEmail.size} unique email(s).`
    );
    for (const g of [...byEmail.values()].slice(0, 10)) {
      console.log(
        `  - ${g.email} | orders=${g.orders.length} | issuedMemberships=${g.issuedMemberships.length}`
      );
    }
    if (byEmail.size > 10) console.log(`  ... and ${byEmail.size - 10} more.`);
    console.log("[sync:past-data] Dry run only. Re-run with --apply to write to past_data.");
    return;
  }

  await connectDb(env.mongoUri, env.mongoDbName);
  console.log(`[sync:past-data] Connected to ${env.mongoDbName}.`);
  const s = await syncTicketTailorPastData();
  console.log(
    `[sync:past-data] Wrote ${s.written} past_data document(s) for ${s.emails} email(s) ` +
      `from ${s.orders} order(s) + ${s.issuedMemberships} issued membership(s).`
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[sync:past-data] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
