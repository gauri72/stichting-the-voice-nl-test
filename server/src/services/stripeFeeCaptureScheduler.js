import TicketOrder from "../models/TicketOrder.js";
import { getStripe } from "./stripe.js";

// Stripe's balance_transaction (the real per-charge fee) isn't attached to a
// charge synchronously — it's created moments after the charge succeeds, so
// capturing it inline during fulfillOrder() often just sees it as still null.
// This sweep re-attempts capture on a short interval until it lands. 15 min is
// generous relative to how quickly Stripe actually settles the balance
// transaction (typically seconds), while keeping the batch small each run.
const TICK_MS = 15 * 60 * 1000;
const BATCH_SIZE = 25;

let timer = null;
let running = false;

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    const stripe = getStripe();
    const orders = await TicketOrder.find({
      orderStatus: "COMPLETED",
      paymentIntentId: { $ne: "" },
      stripeFeeMinor: null,
    })
      .select("_id paymentIntentId")
      .sort({ createdAt: -1 })
      .limit(BATCH_SIZE)
      .lean();

    if (!orders.length) return;

    let captured = 0;
    for (const order of orders) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId, {
          expand: ["latest_charge.balance_transaction"],
        });
        const balanceTransaction = intent.latest_charge?.balance_transaction;
        if (balanceTransaction && typeof balanceTransaction === "object") {
          await TicketOrder.updateOne(
            { _id: order._id },
            { $set: { stripeFeeMinor: Number(balanceTransaction.fee || 0) } }
          );
          captured += 1;
        }
        // else: still not settled on Stripe's side yet — leave null, retried next tick.
      } catch (err) {
        console.warn(`[stripe-fees] capture failed for order ${order._id}: ${err.message}`);
      }
    }
    if (captured > 0) {
      console.log(`[stripe-fees] capture sweep (${reason}): ${captured}/${orders.length} fee(s) captured.`);
    }
  } catch (err) {
    console.warn(`[stripe-fees] capture sweep (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startStripeFeeCaptureScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[stripe-fees] capture scheduler started (every 15m).");
}
