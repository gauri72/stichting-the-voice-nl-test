import mongoose from "mongoose";

const seatHoldSchema = new mongoose.Schema(
  {
    seatHoldId: { type: String, unique: true, sparse: true, trim: true, index: true },
    seatId: { type: String, required: true, index: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    checkoutSessionId: { type: String, default: "", trim: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketOrder", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: "", lowercase: true, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["active", "released", "converted", "expired"], default: "active", index: true },
  },
  { timestamps: true, collection: "seat_holds" }
);

seatHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "expired" } });

const SeatHold = mongoose.models.SeatHold || mongoose.model("SeatHold", seatHoldSchema);
export default SeatHold;
