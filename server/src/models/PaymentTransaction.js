import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    donorEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    kind: { type: String, enum: ["donation", "sponsorship"], required: true, index: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, default: "eur", lowercase: true, trim: true },
    tierId: { type: String, default: "" },
    tierName: { type: String, default: "" },
    receiptNumber: { type: String, default: "" },
    paidAt: { type: Date, required: true }
  },
  { timestamps: true }
);

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;
