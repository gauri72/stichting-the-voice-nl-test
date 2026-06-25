import mongoose from "mongoose";

const apiIntegrationSchema = new mongoose.Schema(
  {
    integrationKey: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, default: "custom", trim: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    baseUrl: { type: String, default: "", trim: true, maxlength: 500 },
    environment: { type: String, enum: ["test", "live"], default: "test", index: true },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "draft", index: true },
    connectionType: { type: String, default: "rest", trim: true },
    authType: { type: String, default: "none", trim: true },
    templateId: { type: String, default: "", trim: true },
    triggers: [{ type: String, trim: true }],
    webhookSecret: { type: String, default: "", select: false },
    oauthConfig: {
      tokenUrl: { type: String, default: "" },
      clientId: { type: String, default: "" },
      scope: { type: String, default: "" },
    },
    sampleResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "api_integrations" }
);

const ApiIntegration =
  mongoose.models.ApiIntegration || mongoose.model("ApiIntegration", apiIntegrationSchema);

export default ApiIntegration;
