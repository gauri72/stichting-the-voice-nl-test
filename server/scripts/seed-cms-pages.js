import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import { ensureDefaultPages } from "../src/services/pageService.js";
import { getAdminHeader } from "../src/services/siteNavigationService.js";
import { getAdminFooter } from "../src/services/siteFooterService.js";

dotenv.config();

async function main() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not configured.");
  await connectDb(env.mongoUri, env.mongoDbName);
  const created = await ensureDefaultPages();
  await getAdminHeader();
  await getAdminFooter();
  console.log(`[seed-cms] Ensured CMS defaults. New pages: ${created.length ? created.join(", ") : "none"}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-cms] Failed:", err);
  process.exit(1);
});
