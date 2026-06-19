import mongoose from "mongoose";
import { DISCOUNT_TYPES, REWARD_STATUSES } from "../config/discountConfig.js";

const discountUsageSchema = new mongoose.Schema(
  {
    usageId: { type: String, unique: true, sparse: true, trim: true, index: true },
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountRule",
      required: true,
      index: true,
    },
    code: { type: String, default: "", trim: true, uppercase: true },
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    orderId: { type: String, default: "", trim: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    membershipId: { type: String, default: "", trim: true },
    subtotalBeforeDiscount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAfterDiscount: { type: Number, default: 0, min: 0 },
    referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referrerEmail: { type: String, default: "", lowercase: true, trim: true },
    rewardAmount: { type: Number, default: 0, min: 0 },
    rewardStatus: {
      type: String,
      enum: REWARD_STATUSES,
      default: "pending",
    },
    usedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "discount_usages" }
);

discountUsageSchema.index({ discountId: 1, userId: 1 });
discountUsageSchema.index({ usedAt: -1 });

const DiscountUsage =
  mongoose.models.DiscountUsage || mongoose.model("DiscountUsage", discountUsageSchema);

export default DiscountUsage;
