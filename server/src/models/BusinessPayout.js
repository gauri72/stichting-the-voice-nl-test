import mongoose from "mongoose";

const businessPayoutSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    businessName: { type: String, default: "", trim: true },
    orderIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    orderCount: { type: Number, default: 0 },
    grossMinor: { type: Number, default: 0 },
    platformFeeMinor: { type: Number, default: 0 },
    netMinor: { type: Number, default: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date, default: null },
    paymentReference: { type: String, default: "", trim: true, maxlength: 200 },
    payoutMethod: { type: String, enum: ["stripe_connect", "bank_transfer", "other"], default: "stripe_connect" },
    stripeTransferId: { type: String, default: "", trim: true, index: true },
    scheduledFor: { type: Date, default: null, index: true },
    ibanSnapshot: { type: String, default: "", trim: true },
    bankHolderSnapshot: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "business_payouts" }
);

businessPayoutSchema.index({ businessId: 1, status: 1 });
businessPayoutSchema.index({ businessId: 1, createdAt: -1 });

const BusinessPayout =
  mongoose.models.BusinessPayout || mongoose.model("BusinessPayout", businessPayoutSchema);

export default BusinessPayout;
