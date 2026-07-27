import ScheduledPrompt from "../models/ScheduledPrompt.js";
import AIResult from "../models/AIResult.js";
import User from "../models/User.js";
import { runScheduledPrompt, computeNextRunAt, attemptChannelDelivery } from "./aiAssistantService.js";

const TICK_MS = 60 * 1000;
let timer = null;
let running = false;

/**
 * Claims a due prompt atomically (advances nextRunAt/lastRunAt) BEFORE running it, not
 * after — a crash mid-AI-call now costs at most one silently-skipped run instead of a
 * duplicate one. The filter's nextRunAt match acts as an optimistic-concurrency guard: if
 * another process already claimed this doc since we read it, the update matches zero
 * documents and findOneAndUpdate returns null.
 */
async function claimDuePrompt(doc) {
  const isOnce = doc.schedule.type === "once";
  const update = isOnce
    ? { status: "paused", nextRunAt: null, lastRunAt: new Date() }
    : { nextRunAt: computeNextRunAt(doc.schedule, new Date()), lastRunAt: new Date() };
  return ScheduledPrompt.findOneAndUpdate(
    { _id: doc._id, nextRunAt: doc.nextRunAt },
    { $set: update },
    { new: false } // the pre-update doc still has the original promptText/notify* fields needed to run it
  );
}

async function runDuePrompts() {
  const due = await ScheduledPrompt.find({ status: "active", nextRunAt: { $lte: new Date() } }).lean();
  let ranCount = 0;
  for (const doc of due) {
    const claimed = await claimDuePrompt(doc);
    if (!claimed) continue; // raced with another claim (or the doc changed) — skip, not a failure
    ranCount += 1;
    try {
      await runScheduledPrompt(claimed);
    } catch (err) {
      console.warn(`[ai-assistant] scheduled prompt ${claimed._id} failed: ${err.message}`);
    }
  }
  return ranCount;
}

/** Re-attempts any email/push channel whose backoff window has elapsed. Reuses the exact
 * same per-channel delivery function the initial attempt uses — see aiAssistantService.js. */
async function runRetryPass() {
  const now = new Date();
  const [dueEmail, duePush] = await Promise.all([
    AIResult.find({ "channels.email.status": "pending_retry", "channels.email.nextRetryAt": { $lte: now } }).lean(),
    AIResult.find({ "channels.push.status": "pending_retry", "channels.push.nextRetryAt": { $lte: now } }).lean(),
  ]);
  const due = [
    ...dueEmail.map((result) => ({ result, channel: "email" })),
    ...duePush.map((result) => ({ result, channel: "push" })),
  ];

  for (const { result, channel } of due) {
    try {
      const [customer, scheduledPrompt] = await Promise.all([
        User.findById(result.customerId).lean(),
        ScheduledPrompt.findById(result.scheduledPromptId).lean(),
      ]);
      if (!customer || !scheduledPrompt) continue; // account or schedule since removed
      await attemptChannelDelivery(result, channel, customer, scheduledPrompt.promptText);
    } catch (err) {
      console.warn(`[ai-assistant] retry for result ${result._id} (${channel}) failed: ${err.message}`);
    }
  }
  return due.length;
}

async function runOnce(reason) {
  if (running) return; // avoid overlapping runs
  running = true;
  try {
    const ranCount = await runDuePrompts();
    const retriedCount = await runRetryPass();
    if (ranCount || retriedCount) {
      console.log(`[ai-assistant] scheduler (${reason}): ran ${ranCount} scheduled prompt(s), retried ${retriedCount} delivery attempt(s).`);
    }
  } catch (err) {
    console.warn(`[ai-assistant] scheduler (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startAiSchedulerService() {
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[ai-assistant] scheduled prompt runner enabled (every 60s).");
}
