import mongoose from "mongoose";

const ticketTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    priceMinor: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    maxPerOrder: { type: Number, default: 10, min: 1 },
    saleStartDate: { type: Date, default: null },
    saleEndDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "sold_out", "hidden"],
      default: "active",
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "ticket_types" }
);

ticketTypeSchema.index({ eventId: 1, sortOrder: 1 });

const TicketType =
  mongoose.models.TicketType || mongoose.model("TicketType", ticketTypeSchema);

export default TicketType;
