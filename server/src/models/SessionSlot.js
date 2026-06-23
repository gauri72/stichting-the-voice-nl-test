import mongoose from "mongoose";

const sessionSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true, unique: true, index: true, trim: true },
    sessionId: { type: String, required: true, index: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    remainingCapacity: { type: Number, required: true, min: 0 },
    priceMinor: { type: Number, default: 0, min: 0 },
    resourceIds: { type: [String], default: [] },
    isBlocked: { type: Boolean, default: false, index: true },
    blockReason: { type: String, default: "", trim: true },
    recurrenceRule: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "session_slots" }
);

sessionSlotSchema.index({ sessionId: 1, startsAt: 1 });
sessionSlotSchema.index({ eventId: 1, startsAt: 1 });

const SessionSlot = mongoose.models.SessionSlot || mongoose.model("SessionSlot", sessionSlotSchema);
export default SessionSlot;
