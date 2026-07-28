import mongoose from "mongoose";

const emailBroadcastLinkSchema = new mongoose.Schema(
  {
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailBroadcast", required: true, index: true },
    originalUrl: { type: String, required: true, maxlength: 2000 },
    label: { type: String, default: "", maxlength: 200 },
    linkToken: { type: String, required: true, unique: true, index: true },
    totalClicks: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "email_broadcast_links" }
);

emailBroadcastLinkSchema.index({ broadcastId: 1, originalUrl: 1 }, { unique: true });

const EmailBroadcastLink =
  mongoose.models.EmailBroadcastLink || mongoose.model("EmailBroadcastLink", emailBroadcastLinkSchema);

export default EmailBroadcastLink;
