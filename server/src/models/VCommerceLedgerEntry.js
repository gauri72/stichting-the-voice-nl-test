import mongoose from "mongoose";

const vCommerceLedgerEntrySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessProfile", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessOrder", default: null, index: true },
    payoutId: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessPayout", default: null, index: true },
    adjustmentId: { type: mongoose.Schema.Types.ObjectId, ref: "VCommerceAdjustment", default: null },
    entryType: {
      type: String,
      enum: ["sale", "fee", "cashback", "credit", "deduction", "waiver", "refund", "payout", "manual", "wallet_transfer"],
      required: true,
      index: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    idempotencyKey: { type: String, required: true, unique: true, trim: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "vcommerce_ledger_entries" }
);

vCommerceLedgerEntrySchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.models.VCommerceLedgerEntry
  || mongoose.model("VCommerceLedgerEntry", vCommerceLedgerEntrySchema);
