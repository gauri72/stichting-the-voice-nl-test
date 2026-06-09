import mongoose from "mongoose";

export async function connectDb(mongoUri, dbName) {
  await mongoose.connect(mongoUri, {
    // Pin the logical database so the app always targets the intended DB
    // (e.g. voice_nl_26) regardless of what is in the connection string path.
    ...(dbName ? { dbName } : {}),
    // Fail fast so a missing DB never delays the API for long.
    serverSelectionTimeoutMS: 2000
  });
}
