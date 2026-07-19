import mongoose from "mongoose";

const businessStripePayoutSchema = new mongoose.Schema(
  {
    stripePayoutId: { type: String, required: true, unique: true, index: true, trim: true },
    stripeConnectedAccountId: { type: String, required: true, index: true, trim: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", index: true, default: null },
    amountMinor: { type: Number, default: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    status: { type: String, default: "pending", index: true, trim: true },
    method: { type: String, default: "standard", trim: true },
    arrivalDate: { type: Date, default: null },
    failureCode: { type: String, default: "", trim: true },
    failureMessage: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    bankLast4: { type: String, default: "", trim: true },
    rawSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "business_stripe_payouts" }
);

businessStripePayoutSchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.models.BusinessStripePayout
  || mongoose.model("BusinessStripePayout", businessStripePayoutSchema);
