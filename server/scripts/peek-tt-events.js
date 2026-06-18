/**
 * Inspect event_summary shape on the first synced TicketTailor order in past_data.
 *
 * Usage (from server/):
 *   node scripts/peek-tt-events.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { connectDb } = await import("../src/db/connectDb.js");
const { default: env } = await import("../src/config/env.js");
const { default: PastData } = await import("../src/models/PastData.js");
const mongoose = (await import("mongoose")).default;

await connectDb(env.mongoUri, env.mongoDbName);
const doc = await PastData.findOne({ orderCount: { $gt: 0 } }).lean();
const order = doc?.orders?.[0];
console.log(JSON.stringify({ event_summary: order?.event_summary, event: order?.event }, null, 2));
await mongoose.disconnect();
