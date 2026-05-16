import app from "./app.js";
import env from "./config/env.js";
import { connectDb } from "./db/connectDb.js";

// Connect when MONGODB_URI is set in the environment (including local dev).
const shouldConnectDb = Boolean(process.env.MONGODB_URI?.trim());

function startServer() {
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

// Start accepting requests immediately so health checks and payment intents
// are never blocked by an optional database. If a real Mongo URI is provided,
// connect in the background and log the result; failures are non-fatal.
startServer();

if (shouldConnectDb) {
  connectDb(env.mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => {
      console.warn("MongoDB connection failed, continuing without DB");
      console.warn(error.message);
    });
} else {
  console.log("MongoDB not configured (MONGODB_URI not set); auth and user storage disabled.");
}
