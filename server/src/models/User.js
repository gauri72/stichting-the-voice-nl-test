import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    passwordHash: { type: String, required: true },
    /** Omit for email/password users — do not store null (breaks sparse unique index). */
    googleId: { type: String },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    isVerified: { type: Boolean, default: false },
    verificationOtpHash: { type: String, default: null },
    verificationOtpExpires: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null }
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone || "",
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
