import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { stripeWebhook } from "./controllers/paymentController.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(morgan("dev"));

// Stripe webhook MUST receive the raw request body (before express.json()).
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Stichting The V.O.I.C.E. NL API" });
});

app.use("/api", apiRoutes);

export default app;
