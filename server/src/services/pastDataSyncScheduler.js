import env from "../config/env.js";
import { syncTicketTailorPastData } from "./pastDataSyncService.js";

let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return; // avoid overlapping runs
  running = true;
  try {
    const s = await syncTicketTailorPastData();
    console.log(
      `[past-data] sync (${reason}): wrote ${s.written} doc(s) for ${s.emails} email(s) ` +
        `from ${s.orders} order(s) + ${s.issuedMemberships} issued membership(s).`
    );
  } catch (err) {
    console.warn(`[past-data] sync (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

/** Start the periodic Ticket Tailor -> past_data sync (no-op if disabled/unconfigured). */
export function startPastDataSyncScheduler() {
  if (!env.pastDataSync.enabled) {
    console.log("[past-data] auto-sync disabled (PAST_DATA_SYNC_ENABLED=false).");
    return;
  }
  if (!env.ticketTailor.apiKey) {
    console.log("[past-data] auto-sync skipped (TICKET_TAILOR_API_KEY not set).");
    return;
  }

  const intervalMs = env.pastDataSync.intervalHours * 60 * 60 * 1000;
  if (env.pastDataSync.runOnStartup) {
    runOnce("startup");
  }
  timer = setInterval(() => runOnce("interval"), intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[past-data] auto-sync enabled (every ${env.pastDataSync.intervalHours}h).`);
}
