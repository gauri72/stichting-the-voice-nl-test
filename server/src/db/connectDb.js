import mongoose from "mongoose";

export async function connectDb(mongoUri) {
  await mongoose.connect(mongoUri, {
    // Fail fast in local dev when MongoDB is not running.
    serverSelectionTimeoutMS: 5000
  });
}
