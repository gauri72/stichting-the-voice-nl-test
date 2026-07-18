import mongoose from "mongoose";

const vCommerceRiskFlagSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessOrder", default: null, index: true },
    category: { type: String, enum: ["onboarding", "payment", "payout", "content", "compliance", "fraud", "other"], default: "other" },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    detail: { type: String, default: "", trim: true, maxlength: 2000 },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    resolvedAt: { type: Date, default: null },
    resolution: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: "vcommerce_risk_flags" }
);

export default mongoose.models.VCommerceRiskFlag
  || mongoose.model("VCommerceRiskFlag", vCommerceRiskFlagSchema);
