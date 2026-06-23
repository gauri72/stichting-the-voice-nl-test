import mongoose from "mongoose";

const apiCredentialSchema = new mongoose.Schema(
  {
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiIntegration", required: true, index: true },
    credentialKey: { type: String, required: true, trim: true, maxlength: 80 },
    encryptedValue: { type: String, default: "" },
    maskedHint: { type: String, default: "" },
  },
  { timestamps: true, collection: "api_credentials" }
);

apiCredentialSchema.index({ integrationId: 1, credentialKey: 1 }, { unique: true });

const ApiCredential =
  mongoose.models.ApiCredential || mongoose.model("ApiCredential", apiCredentialSchema);

export default ApiCredential;
