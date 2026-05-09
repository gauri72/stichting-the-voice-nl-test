import app from "./app.js";
import env from "./config/env.js";
import { connectDb } from "./db/connectDb.js";

// Default MONGODB_URI in env.js points at localhost. On hosted environments
// (Render, Vercel, etc.) Mongo is rarely available there, so awaiting the
// connection at boot adds a 5+ second tax on every cold start. Detect the
// fallback / unset case and skip the DB attempt entirely - the payment flow
// uses Stripe and nodemailer, not Mongo.
const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/voice_nl";
const hasRealMongoUri = Boolean(
  process.env.MONGODB_URI && process.env.MONGODB_URI !== DEFAULT_MONGO_URI
);

function startServer() {
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

// Start accepting requests immediately so health checks and payment intents
// are never blocked by an optional database. If a real Mongo URI is provided,
// connect in the background and log the result; failures are non-fatal.
startServer();

if (hasRealMongoUri) {
  connectDb(env.mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => {
      console.warn("MongoDB connection failed, continuing without DB");
      console.warn(error.message);
    });
} else {
  console.log("MongoDB not configured (MONGODB_URI not set); skipping DB.");
}
