import mongoose from "mongoose";

// One wallet per customer. Balance/points are plain integers in minor units
// (cents) and whole points respectively — never floats, to avoid rounding
// drift across many small top-ups/purchases.
const walletSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balanceMinor: { type: Number, default: 0, min: 0 },
    rewardPoints: { type: Number, default: 0, min: 0 },
    totalEarnedMinor: { type: Number, default: 0 }, // lifetime top-ups + admin credits
    totalSpentMinor: { type: Number, default: 0 }, // lifetime wallet-funded purchases
  },
  { timestamps: true, collection: "wallets" }
);

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);

export default Wallet;
