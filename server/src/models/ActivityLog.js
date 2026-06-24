import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: {
      type: String,
      enum: [
        "profile_updated",
        "password_changed",
        "payment_method_added",
        "booking_started",
        "booking_completed",
        "booking_cancelled",
        "ticket_purchased",
        "rsvp_submitted",
        "session_booked",
        "waitlist_joined",
        "membership_detected",
        "payment_completed",
      ],
      required: true,
    },
    summary: { type: String, required: true, maxlength: 200 },
    detail: { type: String, maxlength: 500, default: "" }
  },
  { timestamps: true, collection: "activitylogs" }
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
