import mongoose from "mongoose";
import {
  DISCOUNT_TYPES,
  DISCOUNT_VALUE_TYPES,
  APPLIES_TO,
  DISCOUNT_STATUSES,
  DISCOUNT_SOURCES,
  REWARD_TYPES,
} from "../config/discountConfig.js";

const discountRuleSchema = new mongoose.Schema(
  {
    discountId: { type: String, unique: true, sparse: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, default: "", trim: true, uppercase: true, index: true },
    type: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: DISCOUNT_VALUE_TYPES,
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: {
      type: String,
      enum: APPLIES_TO,
      default: "tickets",
    },
    eligibleEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    eligibleMembershipTypes: [{ type: String, trim: true }],
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedEmail: { type: String, default: "", lowercase: true, trim: true },
    isPublic: { type: Boolean, default: false },
    referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referrerEmail: { type: String, default: "", lowercase: true, trim: true },
    referrerName: { type: String, default: "", trim: true, maxlength: 160 },
    rewardType: { type: String, enum: [...REWARD_TYPES, ""], default: "" },
    rewardValue: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usageLimitPerUser: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    allowStacking: { type: Boolean, default: true },
    status: {
      type: String,
      enum: DISCOUNT_STATUSES,
      default: "active",
      index: true,
    },
    visibleToUsers: { type: Boolean, default: true },
    showOnDashboard: { type: Boolean, default: true, index: true },
    source: {
      type: String,
      enum: DISCOUNT_SOURCES,
      default: "platform",
      index: true,
    },
    deletedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "discount_rules" }
);

discountRuleSchema.index({ type: 1, status: 1 });
discountRuleSchema.index({ code: 1, status: 1 });
discountRuleSchema.index({ assignedUserId: 1 });
discountRuleSchema.index({ referrerUserId: 1 });
discountRuleSchema.index({ createdAt: -1 });

const DiscountRule =
  mongoose.models.DiscountRule || mongoose.model("DiscountRule", discountRuleSchema);

export default DiscountRule;
