import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["profile_updated"], required: true },
    summary: { type: String, required: true, maxlength: 200 },
    detail: { type: String, maxlength: 500, default: "" }
  },
  { timestamps: true }
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
