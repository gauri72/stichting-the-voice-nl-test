import dns from "node:dns";
import app from "./app.js";
import env from "./config/env.js";
import { validateProductionEnv } from "./config/validateProductionEnv.js";
import { connectDb } from "./db/connectDb.js";
import { ensureIndexes } from "./db/ensureIndexes.js";
import { logStripeConfiguration, loadStripeSecretsFromSettings } from "./services/stripe.js";
import { logTicketTailorConfiguration } from "./services/ticketTailorService.js";
import { startPastDataSyncScheduler } from "./services/pastDataSyncScheduler.js";
import { startDiscountExpiryReminderScheduler } from "./services/discountExpiryReminderScheduler.js";
import { startAiSchedulerService } from "./services/aiSchedulerService.js";
import { startWalletPointsExpiryScheduler } from "./services/walletPointsExpiryScheduler.js";
import { startApplicationDataPurgeScheduler } from "./services/applicationDataPurgeScheduler.js";
import { startReferralRewardAutoApprovalScheduler } from "./services/referralRewardAutoApprovalScheduler.js";
import { startBroadcastPdfScheduler } from "./services/broadcastPdfScheduler.js";
import { logMailConfiguration, verifySmtpConnection, loadEmailSecretsFromSettings } from "./services/smtpTransport.js";
import { cleanupExpiredSeatHolds } from "./services/seatService.js";
import { ensureDefaultTeamMembers } from "./services/teamMemberService.js";
import { ensureDefaultRolesAndPermissions } from "./services/rbacService.js";

// Some local resolvers refuse SRV lookups for mongodb+srv://. Outside production
// (or when DNS_SERVERS is set) fall back to public DNS so we can reach Atlas.
if (env.dnsServers.length || env.nodeEnv !== "production") {
  const servers = env.dnsServers.length ? env.dnsServers : ["8.8.8.8", "1.1.1.1"];
  try {
    dns.setServers(servers);
  } catch (err) {
    console.warn("Could not set custom DNS servers:", err.message);
  }
}

// Connect when MONGODB_URI is set in the environment (including local dev).
const shouldConnectDb = Boolean(process.env.MONGODB_URI?.trim());

function startServer() {
  validateProductionEnv();
  logStripeConfiguration();
  logTicketTailorConfiguration();
  logMailConfiguration();
  verifySmtpConnection().catch(() => {});
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

// Start accepting requests immediately so health checks and payment intents
// are never blocked by an optional database. If a real Mongo URI is provided,
// connect in the background and log the result; failures are non-fatal.
startServer();

if (shouldConnectDb) {
  connectDb(env.mongoUri, env.mongoDbName)
    .then(async () => {
      console.log(`MongoDB connected (db: ${env.mongoDbName})`);
      await ensureIndexes().catch((err) =>
        console.warn("[indexes] ensureIndexes failed:", err.message)
      );
      await ensureDefaultTeamMembers().catch((err) =>
        console.warn("[team-members] seed failed:", err.message)
      );
      await ensureDefaultRolesAndPermissions().catch((err) =>
        console.warn("[rbac] seed failed:", err.message)
      );
      const { ensureStandardCheckoutForms } = await import("./services/checkoutFormService.js");
      await ensureStandardCheckoutForms().catch((err) =>
        console.warn("[checkout-forms] seed failed:", err.message)
      );
      await loadStripeSecretsFromSettings().catch(() => {});
      await loadEmailSecretsFromSettings().catch(() => {});
      startPastDataSyncScheduler();
      startDiscountExpiryReminderScheduler();
      startAiSchedulerService();
      startWalletPointsExpiryScheduler();
      startApplicationDataPurgeScheduler();
      startReferralRewardAutoApprovalScheduler();
      startBroadcastPdfScheduler();
      setInterval(() => {
        cleanupExpiredSeatHolds().catch((err) =>
          console.warn("[seats] hold cleanup failed:", err.message)
        );
      }, 60_000);
    })
    .catch((error) => {
      console.warn("MongoDB connection failed, continuing without DB");
      console.warn(error.message);
    });
} else {
  console.log("MongoDB not configured (MONGODB_URI not set); auth and user storage disabled.");
}
