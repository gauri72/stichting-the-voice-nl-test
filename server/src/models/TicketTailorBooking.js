import mongoose from "mongoose";

const ticketTailorBookingSchema = new mongoose.Schema(
  {
    ticketTailorOrderId: { type: String, required: true, index: true, trim: true },
    ticketTailorTicketId: { type: String, default: "", trim: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    eventName: { type: String, default: "", trim: true, maxlength: 300 },
    eventDate: { type: Date, default: null, index: true },
    ticketType: { type: String, default: "", trim: true, maxlength: 200 },
    quantity: { type: Number, default: 1, min: 0 },
    amountPaidMinor: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "eur", lowercase: true, trim: true },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled", "refunded", "pending"],
      default: "confirmed",
      index: true,
    },
    checkedIn: { type: Boolean, default: false, index: true },
    checkedInAt: { type: Date, default: null },
    bookingDate: { type: Date, default: null, index: true },
    syncedAt: { type: Date, default: Date.now },
    rawOrder: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "tickettailor_bookings" }
);

ticketTailorBookingSchema.index(
  { ticketTailorOrderId: 1, ticketTailorTicketId: 1, ticketType: 1 },
  { unique: true, sparse: true }
);

const TicketTailorBooking =
  mongoose.models.TicketTailorBooking ||
  mongoose.model("TicketTailorBooking", ticketTailorBookingSchema);

export default TicketTailorBooking;
