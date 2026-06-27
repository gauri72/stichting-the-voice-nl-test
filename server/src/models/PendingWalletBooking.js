import mongoose from "mongoose";

// Short-lived quote created by the `prepare_wallet_booking` AI tool. Nothing
// is charged when this is created — `execute_wallet_booking` consumes it
// (and independently re-validates everything) before any money moves.
// Expired/used quotes are left in place as an audit trail rather than deleted.
const pendingWalletBookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketTypeId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalAmountMinor: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["quoted", "executed", "expired"], default: "quoted", index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "pending_wallet_bookings" }
);

const PendingWalletBooking =
  mongoose.models.PendingWalletBooking || mongoose.model("PendingWalletBooking", pendingWalletBookingSchema);

export default PendingWalletBooking;
