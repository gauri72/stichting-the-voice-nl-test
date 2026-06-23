import mongoose from "mongoose";

const apiEndpointSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiIntegration", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
    path: { type: String, default: "/", trim: true, maxlength: 500 },
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },
    queryParams: { type: mongoose.Schema.Types.Mixed, default: {} },
    bodyTemplate: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "api_endpoints" }
);

const ApiEndpoint = mongoose.models.ApiEndpoint || mongoose.model("ApiEndpoint", apiEndpointSchema);

export default ApiEndpoint;
