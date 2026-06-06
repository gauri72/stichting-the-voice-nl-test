import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    membershipId: { type: String, required: true, unique: true, index: true, trim: true },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, default: "", trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    membershipType: { type: String, required: true, trim: true, maxlength: 120 },
    planId: { type: String, required: true, trim: true, index: true },
    amountPaidMinor: { type: Number, required: true },
    currency: { type: String, default: "eur", lowercase: true, trim: true },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    membershipStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true
    },
    qrCodeUrl: { type: String, default: "", trim: true },
    verificationToken: { type: String, required: true, unique: true, index: true },
    paymentReference: { type: String, required: true, unique: true, index: true },
    receiptNumber: { type: String, default: "", trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true }
  },
  { timestamps: true }
);

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export default Member;
