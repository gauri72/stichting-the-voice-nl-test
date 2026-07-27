import mongoose from "mongoose";
import { REWARD_TYPES, REWARD_STATUSES } from "../config/discountConfig.js";

const referralRewardSchema = new mongoose.Schema(
  {
    rewardId: { type: String, unique: true, sparse: true, trim: true, index: true },
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountRule",
      required: true,
      index: true,
    },
    referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    referrerEmail: { type: String, default: "", lowercase: true, trim: true },
    buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    buyerEmail: { type: String, default: "", lowercase: true, trim: true },
    orderId: { type: String, default: "", trim: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    ticketType: { type: String, default: "", trim: true },
    discountGiven: { type: Number, default: 0, min: 0 },
    rewardType: { type: String, enum: REWARD_TYPES, required: true },
    rewardValue: { type: Number, default: 0, min: 0 },
    rewardStatus: {
      type: String,
      enum: REWARD_STATUSES,
      default: "pending",
      index: true,
    },
    // Snapshotted at creation from settings.holdDays so a later settings change never
    // retroactively shifts an already-pending reward's expected hold length. Polled by
    // referralRewardAutoApprovalScheduler.js.
    holdUntil: { type: Date, default: null, index: true },
    // Set by the auto-approval scheduler when a reward reached "approved" but couldn't be
    // auto-paid (no wallet account, a non-currency reward type, or it would exceed the
    // monthly cap) — surfaces a "needs manual payout" signal in the admin table instead of
    // silently doing nothing.
    awaitingManualPayout: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "referral_rewards" }
);

referralRewardSchema.index({ referrerUserId: 1, rewardStatus: 1 });
referralRewardSchema.index({ createdAt: -1 });
referralRewardSchema.index({ rewardStatus: 1, holdUntil: 1 });

const ReferralReward =
  mongoose.models.ReferralReward || mongoose.model("ReferralReward", referralRewardSchema);

export default ReferralReward;
