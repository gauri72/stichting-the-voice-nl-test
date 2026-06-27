import mongoose from "mongoose";

const aiResultSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledPromptId: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledPrompt", required: true, index: true },
    resultText: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
    deliveryMethod: { type: String, enum: ["dashboard", "email", "push"], required: true },
    deliveryStatus: { type: String, enum: ["delivered", "failed"], default: "delivered" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "ai_results" }
);

const AIResult = mongoose.models.AIResult || mongoose.model("AIResult", aiResultSchema);

export default AIResult;
