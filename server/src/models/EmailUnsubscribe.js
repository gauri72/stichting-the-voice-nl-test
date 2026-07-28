import mongoose from "mongoose";

const emailUnsubscribeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    unsubscribeToken: { type: String, required: true, unique: true, index: true },
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcast", default: null },
    reason: { type: String, default: "", maxlength: 300 },
    unsubscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "email_unsubscribes" }
);

const EmailUnsubscribe =
  mongoose.models.EmailUnsubscribe || mongoose.model("EmailUnsubscribe", emailUnsubscribeSchema);

export default EmailUnsubscribe;
