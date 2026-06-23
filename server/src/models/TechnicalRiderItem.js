import mongoose from "mongoose";
import { TECHNICAL_RIDER_SECTIONS, TECHNICAL_RIDER_STATUSES } from "../config/eventOperationsConfig.js";

const technicalRiderItemSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    section: { type: String, enum: TECHNICAL_RIDER_SECTIONS, default: "Sound", index: true },
    requirement: { type: String, required: true, trim: true, maxlength: 300 },
    quantity: { type: Number, default: 1, min: 0 },
    specification: { type: String, default: "", trim: true, maxlength: 2000 },
    responsiblePerson: { type: String, default: "", trim: true, maxlength: 200 },
    supplier: { type: String, default: "", trim: true, maxlength: 200 },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "EventVendor", default: null },
    status: { type: String, enum: TECHNICAL_RIDER_STATUSES, default: "Needed", index: true },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "technical_rider_items" }
);

technicalRiderItemSchema.index({ eventId: 1, section: 1 });

const TechnicalRiderItem =
  mongoose.models.TechnicalRiderItem || mongoose.model("TechnicalRiderItem", technicalRiderItemSchema);

export default TechnicalRiderItem;
