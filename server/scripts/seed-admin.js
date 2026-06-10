import dotenv from "dotenv";
import dns from "node:dns";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import { createAdminAccount } from "../src/services/adminService.js";

dotenv.config();

// Some local resolvers refuse SRV lookups needed for mongodb+srv:// — use public DNS.
dns.setServers(env.dnsServers.length ? env.dnsServers : ["8.8.8.8", "1.1.1.1"]);

const DEFAULT_EMAIL = "admin@stichtingthevoice.nl";
const DEFAULT_PASSWORD = "VoiceAdmin@2025";
const DEFAULT_FIRST_NAME = "Site";
const DEFAULT_LAST_NAME = "Administrator";

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || DEFAULT_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD || DEFAULT_PASSWORD;
  const firstName = process.env.ADMIN_SEED_FIRST_NAME || DEFAULT_FIRST_NAME;
  const lastName = process.env.ADMIN_SEED_LAST_NAME || DEFAULT_LAST_NAME;

  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await connectDb(env.mongoUri, env.mongoDbName);

  try {
    const admin = await createAdminAccount({
      firstName,
      lastName,
      email,
      password,
      role: "superadmin",
    });

    console.log("[seed-admin] Created admin account:");
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Name:     ${admin.firstName} ${admin.lastName}`);
    console.log(`  Role:     ${admin.role}`);
    console.log(`  Password: ${password}`);
    console.log("  Collection: admins (cluster17 / voice_nl_26)");
  } catch (error) {
    if (error.status === 409) {
      console.log(`[seed-admin] Admin already exists for ${email}. No changes made.`);
      console.log("  To reset the password, update the record in the admins collection.");
      process.exit(0);
    }
    throw error;
  }

  process.exit(0);
}

main()
  .catch((error) => {
    console.error("[seed-admin] Failed:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
