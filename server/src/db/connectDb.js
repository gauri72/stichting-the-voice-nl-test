import mongoose from "mongoose";

export async function connectDb(mongoUri) {
  await mongoose.connect(mongoUri, {
    // Fail fast so a missing DB never delays the API for long.
    serverSelectionTimeoutMS: 2000
  });
}
