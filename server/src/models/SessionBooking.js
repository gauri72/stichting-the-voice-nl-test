import mongoose from "mongoose";

const sessionBookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true, trim: true },
    sessionId: { type: String, required: true, index: true, trim: true },
    slotId: { type: String, required: true, index: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerPhone: { type: String, default: "", trim: true },
    participants: { type: Number, default: 1, min: 1 },
    resourceIds: { type: [String], default: [] },
    amountMinor: { type: Number, default: 0, min: 0 },
    discountMinor: { type: Number, default: 0, min: 0 },
    totalMinor: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "free", "failed", "pay_later"],
      default: "pending",
      index: true,
    },
    paymentIntentId: { type: String, default: "", trim: true, index: true },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "pending", "cancelled", "rescheduled", "attended", "no_show"],
      default: "pending",
      index: true,
    },
    discountCode: { type: String, default: "", trim: true },
    membershipDiscountApplied: { type: Boolean, default: false },
    seatLabel: { type: String, default: "", trim: true },
    checkInToken: { type: String, required: true, unique: true, index: true, trim: true },
    qrCodeUrl: { type: String, default: "", trim: true },
    pdfUrl: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "session_bookings" }
);

sessionBookingSchema.index({ sessionId: 1, startsAt: 1 });
sessionBookingSchema.index({ customerEmail: 1, startsAt: -1 });

const SessionBooking =
  mongoose.models.SessionBooking || mongoose.model("SessionBooking", sessionBookingSchema);
export default SessionBooking;
