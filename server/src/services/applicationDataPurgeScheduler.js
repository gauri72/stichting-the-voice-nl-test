import BusinessApplication from "../models/BusinessApplication.js";

const TICK_MS = 24 * 60 * 60 * 1000; // once a day is plenty for a 30-day retention window
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    const result = await BusinessApplication.updateMany(
      {
        status: "rejected",
        reviewedAt: { $lte: cutoff },
        "payoutRegistration.legalName": { $ne: "" },
      },
      { $unset: { payoutRegistration: "" } }
    );
    console.log(`[vcommerce] payout data purge (${reason}): ${result.modifiedCount} rejected application(s) purged.`);
  } catch (err) {
    console.warn(`[vcommerce] payout data purge (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startApplicationDataPurgeScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[vcommerce] payout data purge scheduler started (every 24h, 30-day retention).");
}
