import ScheduledPrompt from "../models/ScheduledPrompt.js";
import { runScheduledPrompt, computeNextRunAt } from "./aiAssistantService.js";

const TICK_MS = 60 * 1000;
let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return; // avoid overlapping runs
  running = true;
  try {
    const due = await ScheduledPrompt.find({ status: "active", nextRunAt: { $lte: new Date() } });
    for (const scheduledPrompt of due) {
      try {
        await runScheduledPrompt(scheduledPrompt);
      } catch (err) {
        console.warn(`[ai-assistant] scheduled prompt ${scheduledPrompt._id} failed: ${err.message}`);
      }

      scheduledPrompt.lastRunAt = new Date();
      if (scheduledPrompt.schedule.type === "once") {
        scheduledPrompt.status = "paused";
        scheduledPrompt.nextRunAt = null;
      } else {
        scheduledPrompt.nextRunAt = computeNextRunAt(scheduledPrompt.schedule, new Date());
      }
      await scheduledPrompt.save();
    }
    if (due.length) {
      console.log(`[ai-assistant] scheduler (${reason}): ran ${due.length} scheduled prompt(s).`);
    }
  } catch (err) {
    console.warn(`[ai-assistant] scheduler (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

/** Start the periodic scheduled-prompt runner (checks every 60s for due prompts). */
export function startAiSchedulerService() {
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[ai-assistant] scheduled prompt runner enabled (every 60s).");
}
