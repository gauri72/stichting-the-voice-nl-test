import mongoose from "mongoose";

const userLoginEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    method: { type: String, enum: ["password", "google"], required: true },
  },
  { timestamps: true, collection: "user_login_events" }
);

userLoginEventSchema.index({ createdAt: -1 });

const UserLoginEvent =
  mongoose.models.UserLoginEvent || mongoose.model("UserLoginEvent", userLoginEventSchema);

export default UserLoginEvent;
