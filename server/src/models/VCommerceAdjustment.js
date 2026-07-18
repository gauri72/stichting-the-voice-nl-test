import mongoose from "mongoose";

const vCommerceAdjustmentSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessOrder", default: null, index: true },
    chargeRuleId: { type: mongoose.Schema.Types.ObjectId, ref: "VCommerceChargeRule", default: null },
    kind: { type: String, enum: ["waiver", "credit", "deduction", "refund", "manual_charge"], required: true, index: true },
    chargeType: { type: String, default: "manual", trim: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    maxUses: { type: Number, default: null, min: 1 },
    uses: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "applied", "expired", "cancelled"], default: "active", index: true },
    payoutEffect: { type: String, enum: ["increase", "decrease", "none"], default: "none" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "vcommerce_adjustments" }
);

vCommerceAdjustmentSchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.models.VCommerceAdjustment
  || mongoose.model("VCommerceAdjustment", vCommerceAdjustmentSchema);
