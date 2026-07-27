import mongoose from "mongoose";

// One global, singleton document (key: "default") — mirrors WalletGlobalSettings /
// MembershipCheckoutSettings's shape. `enabled` is the real referral kill switch (gates
// checkout redemption, not just the dashboard widget — see discountService.js's
// validateRuleEligibility). The default*/holdDays/monthlyCapMinor fields only govern
// codes this system auto-issues to members; an admin's own hand-crafted referral
// DiscountRule keeps whatever values were set on it directly.
const referralProgramSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    enabled: { type: Boolean, default: true },
    autoIssueOnDashboardVisit: { type: Boolean, default: true },
    defaultDiscountType: { type: String, enum: ["percentage", "fixed_amount"], default: "percentage" },
    defaultDiscountValue: { type: Number, default: 10 },
    defaultRewardType: {
      type: String,
      enum: ["credit", "free_ticket", "fixed_amount", "percentage", "manual"],
      default: "percentage",
    },
    defaultRewardValue: { type: Number, default: 10 },
    holdDays: { type: Number, default: 14, min: 0 },
    // 0/null = uncapped
    monthlyCapMinor: { type: Number, default: 5000, min: 0 },
  },
  { timestamps: true, collection: "referral_program_settings" }
);

const ReferralProgramSettings =
  mongoose.models.ReferralProgramSettings ||
  mongoose.model("ReferralProgramSettings", referralProgramSettingsSchema);

export default ReferralProgramSettings;
