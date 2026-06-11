import mongoose from "mongoose";

const discountCodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    code: { type: String, required: true, unique: true, trim: true },
    discountValue: { type: Number, required: true },
    isGlobal: { type: Boolean, default: false },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

discountCodeSchema.index({ createdAt: -1 });

const DiscountCode =
  mongoose.models.DiscountCode || mongoose.model("DiscountCode", discountCodeSchema);

export default DiscountCode;
