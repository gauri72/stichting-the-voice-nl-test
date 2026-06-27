import mongoose from "mongoose";

// The full wallet ledger — every balance or points movement gets one row
// here, regardless of cause, so transaction history and admin audit views
// are a single straightforward query.
const walletTransactionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["topup", "purchase", "refund", "pointsEarned", "pointsRedeemed", "pointsExpired", "adminCredit", "adminDebit"],
      required: true,
      index: true,
    },
    amountMinor: { type: Number, default: 0 }, // signed: positive = credit, negative = debit
    points: { type: Number, default: 0 }, // signed: positive = earned, negative = redeemed/expired
    description: { type: String, default: "", trim: true, maxlength: 300 },
    referenceType: { type: String, enum: ["ticketOrder", "topup", "admin", "aiBooking", ""], default: "" },
    referenceId: { type: String, default: "", trim: true },
    initiatedBy: { type: String, enum: ["customer", "ai", "admin"], default: "customer", index: true },
    paymentIntentId: { type: String, default: "", trim: true, index: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed", index: true },
    // Only set on `pointsEarned` rows — the points-expiry scheduler reads these.
    expiresAt: { type: Date, default: null },
    expired: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "wallet_transactions" }
);

walletTransactionSchema.index({ customerId: 1, createdAt: -1 });

const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;
