import mongoose from "mongoose";
import { SEAT_STATUSES, SEAT_CATEGORIES } from "../config/seatConfig.js";

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true, unique: true, trim: true, index: true },
    seatMapId: { type: String, required: true, index: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    section: { type: String, default: "Main Hall", trim: true, maxlength: 80 },
    row: { type: String, required: true, trim: true, maxlength: 10, index: true },
    seatNumber: { type: String, required: true, trim: true, maxlength: 10 },
    seatLabel: { type: String, default: "", trim: true, maxlength: 20 },
    category: { type: String, enum: SEAT_CATEGORIES, default: "regular", index: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null },
    priceOverrideMinor: { type: Number, default: null, min: 0 },
    status: { type: String, enum: SEAT_STATUSES, default: "available", index: true },
    xPercent: { type: Number, default: 0, min: 0, max: 100 },
    yPercent: { type: Number, default: 0, min: 0, max: 100 },
    width: { type: Number, default: 2.5, min: 0.5, max: 20 },
    height: { type: Number, default: 2.5, min: 0.5, max: 20 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "seats" }
);

seatSchema.index({ eventId: 1, row: 1, seatNumber: 1 });
seatSchema.index({ eventId: 1, status: 1 });

const Seat = mongoose.models.Seat || mongoose.model("Seat", seatSchema);
export default Seat;
