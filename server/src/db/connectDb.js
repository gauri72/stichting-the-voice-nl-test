import dns from "dns";
import mongoose from "mongoose";

function configureDnsForSrvUri(mongoUri) {
  if (!mongoUri?.startsWith("mongodb+srv://")) return;

  const custom = process.env.MONGODB_DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (custom?.length) {
    dns.setServers(custom);
    return;
  }

  // Windows + Node sometimes fails SRV lookups against the router DNS (querySrv ECONNREFUSED)
  // while system tools like nslookup still work. Public resolvers are a safe fallback.
  if (process.platform === "win32") {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  }
}

export async function connectDb(mongoUri, dbName) {
  configureDnsForSrvUri(mongoUri);

  await mongoose.connect(mongoUri, {
    // Pin the logical database so the app always targets the intended DB
    // (e.g. voice_nl_26) regardless of what is in the connection string path.
    ...(dbName ? { dbName } : {}),
    // Fail fast so a missing DB never delays the API for long.
    serverSelectionTimeoutMS: 2000
  });
}
