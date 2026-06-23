import mongoose from "mongoose";

const apiWebhookEventSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiIntegration", required: true, index: true },
    integrationKey: { type: String, required: true, trim: true, index: true },
    signatureValid: { type: Boolean, default: false },
    payloadMasked: { type: String, default: "" },
    headersMasked: { type: mongoose.Schema.Types.Mixed, default: {} },
    processed: { type: Boolean, default: false, index: true },
    errorMessage: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: "api_webhook_events" }
);

const ApiWebhookEvent =
  mongoose.models.ApiWebhookEvent || mongoose.model("ApiWebhookEvent", apiWebhookEventSchema);

export default ApiWebhookEvent;
