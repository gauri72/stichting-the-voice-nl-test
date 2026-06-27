import mongoose from "mongoose";

const aiUsageCounterSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    promptCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "ai_usage_counters" }
);

aiUsageCounterSchema.index({ customerId: 1, date: 1 }, { unique: true });

const AiUsageCounter = mongoose.models.AiUsageCounter || mongoose.model("AiUsageCounter", aiUsageCounterSchema);

export default AiUsageCounter;
