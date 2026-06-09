import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    active: { type: Boolean, default: true },
    planId: {
      type: String,
      enum: [
        "student",
        "privilegedSingle",
        "privilegedFamily",
        "premiumSingle",
        "premiumFamily",
        "family",
        "single",
        "privileged",
        "vownl"
      ],
      default: "privilegedFamily"
    },
    planName: { type: String, default: "", trim: true, maxlength: 120 },
    feeMinor: { type: Number, default: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    renewalAt: { type: Date, default: null },
    membershipNumber: { type: String, default: "", trim: true, maxlength: 40 }
  },
  { timestamps: true, collection: "memberships" }
);

membershipSchema.index({ userId: 1, active: 1 });

const Membership = mongoose.models.Membership || mongoose.model("Membership", membershipSchema);

export default Membership;
