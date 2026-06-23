import mongoose from "mongoose";

const apiFieldMappingSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiIntegration", required: true, index: true },
    direction: { type: String, enum: ["request", "response"], default: "response" },
    sourcePath: { type: String, required: true, trim: true, maxlength: 300 },
    targetPath: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: "api_field_mappings" }
);

const ApiFieldMapping =
  mongoose.models.ApiFieldMapping || mongoose.model("ApiFieldMapping", apiFieldMappingSchema);

export default ApiFieldMapping;
