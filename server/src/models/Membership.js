import mongoose from "mongoose";

/** When membership checkout is wired, records active membership per user. */
const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    active: { type: Boolean, default: true },
    startedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

const Membership = mongoose.models.Membership || mongoose.model("Membership", membershipSchema);

export default Membership;
