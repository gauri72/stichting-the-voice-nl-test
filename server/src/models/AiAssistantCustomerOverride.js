import mongoose from "mongoose";

// Sparse — only created when an admin actually overrides a specific customer,
// so it doesn't bloat the User collection with rarely-used fields.
const overrideSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    enabledOverride: { type: Boolean, default: null }, // null = inherit global
    dailyLimitOverride: { type: Number, default: null }, // null = inherit tier default
  },
  { timestamps: true, collection: "ai_assistant_customer_overrides" }
);

const AiAssistantCustomerOverride =
  mongoose.models.AiAssistantCustomerOverride ||
  mongoose.model("AiAssistantCustomerOverride", overrideSchema);

export default AiAssistantCustomerOverride;
