import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { stripeWebhook } from "./controllers/paymentController.js";
import { stripeVCommerceWebhook } from "./controllers/vcommerceWebhookController.js";
import { handleError } from "./utils/handleError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const walletAssetsDir = path.join(__dirname, "assets", "wallet");
const publicUploadsDir = path.join(process.cwd(), "public", "uploads");

const app = express();

// Render's load balancer is the only hop in front of this service, so trust
// exactly one proxy — this makes req.ip reflect the real client IP (derived
// from the trusted X-Forwarded-For entry) instead of a client-spoofable
// header value, which the rate limiters below rely on.
app.set("trust proxy", 1);

// Allow QR / PDF assets to load on the separate static frontend host (e.g. Render web + API).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(morgan("dev"));

// Stripe webhooks MUST receive the raw request body (before express.json()).
// Two separate Stripe accounts, two separate endpoints/secrets.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
app.post(
  "/api/payments/webhook/vcommerce",
  express.raw({ type: "application/json" }),
  stripeVCommerceWebhook
);

// Admin routes embed base64 file/image uploads (media library, event
// documents, design system, etc.) in the JSON body — the largest real
// upload is a 10MB operations document, ~13.3MB once base64-encoded.
// Public routes (contact forms, checkout, RSVP, etc.) never need anywhere
// near that, so they get a much smaller default to limit DoS exposure.
app.use("/api/admin", express.json({ limit: "15mb" }));
app.use("/api/admin", express.urlencoded({ extended: true, limit: "15mb" }));

// V.Commerce business logo/banner uploads embed base64 image data in the JSON
// body — a 5MB image is ~6.7MB once base64-encoded, so this needs more room
// than the public default below.
app.use("/api/vcommerce-portal", express.json({ limit: "8mb" }));
app.use("/api/vcommerce-portal", express.urlencoded({ extended: true, limit: "8mb" }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Strips `$`/`.`-prefixed keys from body/query/params so a query-string
// operator injection (e.g. ?field[$ne]=null) can't reach Mongoose filters —
// on top of, not instead of, each service's own input handling.
app.use(mongoSanitize());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Stichting The V.O.I.C.E. NL API" });
});

app.use("/assets/wallet", express.static(walletAssetsDir, { maxAge: "7d" }));
app.use("/uploads", express.static(publicUploadsDir, { maxAge: "1h" }));

app.use("/api", apiRoutes);

// Catches errors from middleware that run outside any controller's own
// try/catch (malformed JSON bodies, uncaught multer errors, etc.) so they get
// the same sanitized-message treatment as everything else.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  return handleError(res, err, { logTag: "[uncaught]" });
});

export default app;
