import mongoose from "mongoose";

const vCommerceChargeRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    chargeType: {
      type: String,
      enum: ["setup", "subscription", "platform_fee", "processing", "cashback", "promotion", "handling", "manual"],
      required: true,
      index: true,
    },
    scope: { type: String, enum: ["marketplace", "plan", "business", "product"], default: "marketplace", index: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", default: null, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProduct", default: null, index: true },
    packageId: { type: String, enum: ["starter", "growth", "spotlight", ""], default: "" },
    calculation: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    amountMinor: { type: Number, default: 0, min: 0 },
    percent: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: "eur", lowercase: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "vcommerce_charge_rules" }
);

vCommerceChargeRuleSchema.index({ code: 1, scope: 1, businessId: 1, productId: 1 }, { unique: true });

export default mongoose.models.VCommerceChargeRule
  || mongoose.model("VCommerceChargeRule", vCommerceChargeRuleSchema);
