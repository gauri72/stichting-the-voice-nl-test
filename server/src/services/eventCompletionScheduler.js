import Event from "../models/Event.js";

const TICK_MS = 60 * 60 * 1000; // hourly is plenty for a day-granularity transition

let timer = null;
let running = false;

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    const result = await Event.updateMany(
      { status: "published", date: { $lt: startOfToday() } },
      { $set: { status: "completed" } }
    );
    const matched = result.modifiedCount ?? result.nModified ?? 0;
    if (matched > 0) {
      console.log(`[events] completion sweep (${reason}): ${matched} event(s) marked completed.`);
    }
  } catch (err) {
    console.warn(`[events] completion sweep (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startEventCompletionScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[events] completion scheduler started (hourly).");
}
