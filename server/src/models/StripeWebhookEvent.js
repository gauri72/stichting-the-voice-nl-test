import mongoose from "mongoose";

const stripeWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, default: "" },
    paymentIntentId: { type: String, default: "", index: true },
    processed: { type: Boolean, default: true },
    error: { type: String, default: "" },
  },
  { timestamps: true, collection: "stripe_webhook_events" }
);

const StripeWebhookEvent =
  mongoose.models.StripeWebhookEvent || mongoose.model("StripeWebhookEvent", stripeWebhookEventSchema);

export default StripeWebhookEvent;
