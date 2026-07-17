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
    alternateEmails: [{ type: String, lowercase: true, trim: true }],
    partnerDetails: {
      name: { type: String, default: "", trim: true, maxlength: 160 },
      email: { type: String, default: "", lowercase: true, trim: true, maxlength: 160 },
      phone: { type: String, default: "", trim: true, maxlength: 40 },
      relationship: { type: String, default: "", trim: true, maxlength: 80 },
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    transferRecipientEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    transferHistory: [
      {
        fromName: { type: String, default: "", trim: true },
        fromEmail: { type: String, default: "", lowercase: true, trim: true },
        toName: { type: String, default: "", trim: true },
        toEmail: { type: String, default: "", lowercase: true, trim: true },
        reason: { type: String, default: "", trim: true, maxlength: 500 },
        transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
        transferredAt: { type: Date, default: Date.now },
      },
    ],
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
    seatMapId: { type: String, default: "", trim: true, index: true },
    seatId: { type: String, default: "", trim: true, index: true },
    section: { type: String, default: "", trim: true },
    row: { type: String, default: "", trim: true, index: true },
    seatNumber: { type: String, default: "", trim: true },
    seatLabel: { type: String, default: "", trim: true },
    seatCategory: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "tickets" }
);

ticketSchema.index({ eventId: 1, checkedIn: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;
