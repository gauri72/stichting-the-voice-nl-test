/**
 * Converts existing ScheduledPrompt.deliveryMethod (old single "dashboard"|"email"|"push"
 * enum) into the new independent notifyEmail/notifyPush booleans. In-app delivery is now
 * always-on regardless of what this converts to, so a "dashboard"-only row correctly ends
 * up with both flags false — it already gets the in-app inbox for free, nothing to opt into.
 *
 * Usage:
 *   node server/scripts/migrate-ai-scheduled-prompt-delivery.js            # dry run (no writes)
 *   node server/scripts/migrate-ai-scheduled-prompt-delivery.js --apply    # apply the update
 *
 * Requires MONGODB_URI in server/.env.
 */
import "../src/config/env.js";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import ScheduledPrompt from "../src/models/ScheduledPrompt.js";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("[migrate:ai-scheduled-prompt-delivery] MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  await connectDb(env.mongoUri);

  // The old field no longer exists on the schema, so read it via the raw collection
  // rather than the Mongoose model (which would silently strip it on hydration).
  const rows = await mongoose.connection.collection("ai_scheduled_prompts")
    .find({ deliveryMethod: { $exists: true } })
    .project({ deliveryMethod: 1 })
    .toArray();

  console.log(`[migrate:ai-scheduled-prompt-delivery] ${rows.length} record(s) to convert.`);
  for (const r of rows) {
    const notifyEmail = r.deliveryMethod === "email";
    const notifyPush = r.deliveryMethod === "push";
    console.log(`  - ${r._id} | deliveryMethod="${r.deliveryMethod}" -> notifyEmail=${notifyEmail}, notifyPush=${notifyPush}`);
  }

  if (!apply) {
    console.log("[migrate:ai-scheduled-prompt-delivery] Dry run only. Re-run with --apply to write changes.");
    await mongoose.disconnect();
    return;
  }

  if (rows.length === 0) {
    console.log("[migrate:ai-scheduled-prompt-delivery] Nothing to update.");
    await mongoose.disconnect();
    return;
  }

  for (const r of rows) {
    await ScheduledPrompt.updateOne(
      { _id: r._id },
      {
        $set: { notifyEmail: r.deliveryMethod === "email", notifyPush: r.deliveryMethod === "push" },
        $unset: { deliveryMethod: "" },
      }
    );
  }
  console.log(`[migrate:ai-scheduled-prompt-delivery] Updated ${rows.length} record(s).`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[migrate:ai-scheduled-prompt-delivery] Failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
