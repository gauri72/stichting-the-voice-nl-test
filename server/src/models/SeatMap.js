import mongoose from "mongoose";
import { SEATING_MODES } from "../config/seatConfig.js";

const seatMapSchema = new mongoose.Schema(
  {
    seatMapId: { type: String, unique: true, sparse: true, trim: true, index: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, default: "Main Hall", trim: true, maxlength: 160 },
    venueName: { type: String, default: "", trim: true, maxlength: 160 },
    imageUrl: { type: String, default: "" },
    imageWidth: { type: Number, default: 1920 },
    imageHeight: { type: Number, default: 1080 },
    stageLabel: { type: String, default: "Screen / Stage", trim: true },
    seatingMode: { type: String, enum: SEATING_MODES, default: "general_admission" },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "seat_maps" }
);

const SeatMap = mongoose.models.SeatMap || mongoose.model("SeatMap", seatMapSchema);
export default SeatMap;
