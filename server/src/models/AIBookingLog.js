import mongoose from "mongoose";

// Every AI-initiated booking attempt gets a row here, separate from the
// general WalletTransaction ledger, so admin's "view all AI-initiated
// bookings" is a single dedicated query rather than a filter over everything.
const aiBookingLogSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, default: "", trim: true, maxlength: 1000 },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    ticketTypeId: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    totalAmountMinor: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["quoted", "awaiting_confirmation", "confirmed", "failed", "expired"],
      default: "quoted",
      index: true,
    },
    failureReason: { type: String, default: "" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketOrder", default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "ai_booking_logs" }
);

const AIBookingLog = mongoose.models.AIBookingLog || mongoose.model("AIBookingLog", aiBookingLogSchema);

export default AIBookingLog;
