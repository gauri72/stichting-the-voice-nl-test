import mongoose from "mongoose";

// One global, singleton document (key: "default") holding the feature
// toggle, wallet caps, 2FA threshold, and the reward points program's rules —
// mirrors AiAssistantSettings's singleton shape.
const walletGlobalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    enabled: { type: Boolean, default: true },
    maxWalletBalanceMinor: { type: Number, default: 50000 }, // €500 per-customer cap
    twoFactorTopUpThresholdMinor: { type: Number, default: 10000 }, // €100 — OTP required above this
    pointsPerEuroSpent: { type: Number, default: 1 }, // 1 point per €1 spent via wallet
    minRedemptionPoints: { type: Number, default: 100 },
    pointsNeededPerEuroDiscount: { type: Number, default: 100 }, // 100 points = €1 off
    pointsExpiryDays: { type: Number, default: 365 },
    bonusMultipliers: {
      firstPurchaseBonusPoints: { type: Number, default: 50 },
      referralBonusPoints: { type: Number, default: 100 },
      promo: {
        active: { type: Boolean, default: false },
        multiplier: { type: Number, default: 2 },
        endsAt: { type: Date, default: null },
      },
    },
  },
  { timestamps: true, collection: "wallet_global_settings" }
);

const WalletGlobalSettings =
  mongoose.models.WalletGlobalSettings || mongoose.model("WalletGlobalSettings", walletGlobalSettingsSchema);

export default WalletGlobalSettings;
