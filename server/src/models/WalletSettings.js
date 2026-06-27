import mongoose from "mongoose";

// Sparse, per-customer wallet preferences — only created the first time a
// customer touches their wallet settings (mirrors AiAssistantCustomerOverride's
// sparse-by-default pattern instead of bloating the User model).
const walletSettingsSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    aiBookingEnabled: { type: Boolean, default: false }, // opt-in only
    maxAISpendPerTransactionMinor: { type: Number, default: 5000 }, // €50 default cap
    dailyAISpendLimitMinor: { type: Number, default: 10000 }, // €100 default cap
    lowBalanceThresholdMinor: { type: Number, default: 500 }, // €5 default
    confirmationStepEnabled: { type: Boolean, default: true }, // safer default — opt out, not in
    defaultTopUpAmountMinor: { type: Number, default: 2000 }, // €20 default
    // 2FA for top-ups above the admin-configured threshold — reuses the same
    // hash/expiry/email-OTP mechanism as signup verification, just scoped here.
    topUpOtpHash: { type: String, default: null, select: false },
    topUpOtpExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true, collection: "wallet_settings" }
);

const WalletSettings = mongoose.models.WalletSettings || mongoose.model("WalletSettings", walletSettingsSchema);

export default WalletSettings;
