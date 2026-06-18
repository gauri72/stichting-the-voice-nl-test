import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true, trim: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketOrder",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    ticketTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
      index: true,
    },
    ticketTypeName: { type: String, required: true, trim: true },
    attendeeName: { type: String, required: true, trim: true, maxlength: 160 },
    attendeeEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    verificationToken: { type: String, required: true, unique: true, index: true },
    qrCodeUrl: { type: String, default: "", trim: true },
    pdfUrl: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["valid", "cancelled", "refunded"],
      default: "valid",
      index: true,
    },
    checkedIn: { type: Boolean, default: false, index: true },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "tickets" }
);

ticketSchema.index({ eventId: 1, checkedIn: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;
