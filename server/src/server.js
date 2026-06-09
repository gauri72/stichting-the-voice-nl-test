import dns from "node:dns";
import app from "./app.js";
import env from "./config/env.js";
import { connectDb } from "./db/connectDb.js";
import { logStripeConfiguration } from "./services/stripe.js";
import { logTicketTailorConfiguration } from "./services/ticketTailorService.js";
import { startPastDataSyncScheduler } from "./services/pastDataSyncScheduler.js";
import { logMailConfiguration, verifySmtpConnection } from "./services/smtpTransport.js";

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
    .then(() => {
      console.log(`MongoDB connected (db: ${env.mongoDbName})`);
      startPastDataSyncScheduler();
    })
    .catch((error) => {
      console.warn("MongoDB connection failed, continuing without DB");
      console.warn(error.message);
    });
} else {
  console.log("MongoDB not configured (MONGODB_URI not set); auth and user storage disabled.");
}
