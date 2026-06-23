import mongoose from "mongoose";

const apiExecutionLogSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiIntegration", required: true, index: true },
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiEndpoint", default: null, index: true },
    integrationName: { type: String, default: "", trim: true },
    endpointName: { type: String, default: "", trim: true },
    trigger: { type: String, default: "manual_admin", trim: true, index: true },
    status: { type: String, enum: ["success", "error", "pending"], default: "pending", index: true },
    requestTime: { type: Date, default: Date.now, index: true },
    responseCode: { type: Number, default: null },
    durationMs: { type: Number, default: null },
    errorMessage: { type: String, default: "", trim: true, maxlength: 2000 },
    retryCount: { type: Number, default: 0 },
    resolved: { type: Boolean, default: false, index: true },
    requestMeta: {
      method: { type: String, default: "GET" },
      url: { type: String, default: "" },
      queryParams: { type: mongoose.Schema.Types.Mixed, default: {} },
      body: { type: String, default: "" },
    },
    requestMasked: { type: String, default: "" },
    responseMasked: { type: String, default: "" },
  },
  { timestamps: true, collection: "api_execution_logs" }
);

apiExecutionLogSchema.index({ integrationId: 1, requestTime: -1 });

const ApiExecutionLog =
  mongoose.models.ApiExecutionLog || mongoose.model("ApiExecutionLog", apiExecutionLogSchema);

export default ApiExecutionLog;
