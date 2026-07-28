import EmailBroadcast from "../models/EmailBroadcast.js";
import { generateBroadcastPdf } from "./broadcastPdfService.js";

// Short tick — an admin just clicked "Download PDF" and is watching the status poll, unlike
// the multi-hour-scale schedulers elsewhere in this codebase (referral payouts, wallet point
// expiry) where nothing is waiting on the result in real time.
const TICK_MS = 10_000;

let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    // One at a time — Puppeteer PDF rendering is memory-heavy, and this queue is not
    // expected to be deep (admins downloading a specific broadcast's report), so there's no
    // benefit to parallelizing at the cost of multiple concurrent Chromium pages.
    const queued = await EmailBroadcast.findOne({ pdfStatus: "queued" }).select("_id").lean();
    if (!queued) return;
    await generateBroadcastPdf(queued._id).catch((err) =>
      console.warn(`[broadcast-pdf] generation (${reason}) failed for ${queued._id}: ${err.message}`)
    );
  } catch (err) {
    console.warn(`[broadcast-pdf] scheduler tick (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startBroadcastPdfScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[broadcast-pdf] scheduler started (every 10s).");
}
