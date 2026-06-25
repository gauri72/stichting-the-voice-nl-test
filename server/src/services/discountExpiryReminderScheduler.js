import env from "../config/env.js";
import { sendExpiringDiscountReminders } from "./discountService.js";

let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return; // avoid overlapping runs
  running = true;
  try {
    const { checked, sent } = await sendExpiringDiscountReminders(
      env.discountExpiryReminder.reminderWindowDays
    );
    console.log(`[discounts] expiry reminder (${reason}): checked ${checked}, sent ${sent}.`);
  } catch (err) {
    console.warn(`[discounts] expiry reminder (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

/** Start the periodic discount-expiry reminder check (no-op if disabled). */
export function startDiscountExpiryReminderScheduler() {
  if (!env.discountExpiryReminder.enabled) {
    console.log("[discounts] expiry reminder disabled (DISCOUNT_EXPIRY_REMINDER_ENABLED=false).");
    return;
  }

  const intervalMs = env.discountExpiryReminder.intervalHours * 60 * 60 * 1000;
  if (env.discountExpiryReminder.runOnStartup) {
    runOnce("startup");
  }
  timer = setInterval(() => runOnce("interval"), intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[discounts] expiry reminder enabled (every ${env.discountExpiryReminder.intervalHours}h).`);
}
