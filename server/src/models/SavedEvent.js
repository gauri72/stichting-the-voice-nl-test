import mongoose from "mongoose";

const savedEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  },
  { timestamps: true }
);

savedEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.models.SavedEvent || mongoose.model("SavedEvent", savedEventSchema);
