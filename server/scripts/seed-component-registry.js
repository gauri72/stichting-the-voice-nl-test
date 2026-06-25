import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import { ensureComponentRegistry } from "../src/services/componentRegistryService.js";

dotenv.config();

async function main() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not configured.");
  await connectDb(env.mongoUri, env.mongoDbName);
  const registered = await ensureComponentRegistry();
  console.log(`[seed-component-registry] Registered ${registered.length} component(s): ${registered.join(", ")}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-component-registry] Failed:", err);
  process.exit(1);
});
