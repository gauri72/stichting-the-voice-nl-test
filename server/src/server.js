import app from "./app.js";
import env from "./config/env.js";
import { connectDb } from "./db/connectDb.js";

async function bootstrap() {
  try {
    await connectDb(env.mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB connection failed, continuing without DB");
    console.warn(error.message);
  }

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap();
