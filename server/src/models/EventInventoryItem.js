import mongoose from "mongoose";
import { INVENTORY_CATEGORIES, INVENTORY_STATUSES } from "../config/eventOperationsConfig.js";

const eventInventoryItemSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    itemName: { type: String, required: true, trim: true, maxlength: 300 },
    category: { type: String, enum: INVENTORY_CATEGORIES, default: "Miscellaneous", index: true },
    quantityNeeded: { type: Number, default: 1, min: 0 },
    quantityConfirmed: { type: Number, default: 0, min: 0 },
    quantityUsed: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "pcs", trim: true, maxlength: 40 },
    source: { type: String, default: "", trim: true, maxlength: 200 },
    owner: { type: String, default: "", trim: true, maxlength: 200 },
    supplierVendor: { type: String, default: "", trim: true, maxlength: 200 },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "EventVendor", default: null },
    globalInventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "GlobalInventoryItem", default: null },
    costMinor: { type: Number, default: 0, min: 0 },
    depositMinor: { type: Number, default: 0, min: 0 },
    returnRequired: { type: Boolean, default: false },
    returnStatus: { type: String, default: "", trim: true, maxlength: 100 },
    conditionBefore: { type: String, default: "", trim: true, maxlength: 500 },
    conditionAfter: { type: String, default: "", trim: true, maxlength: 500 },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    assignedTeamMember: { type: String, default: "", trim: true, maxlength: 200 },
    status: { type: String, enum: INVENTORY_STATUSES, default: "Needed", index: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "event_inventory_items" }
);

eventInventoryItemSchema.index({ eventId: 1, status: 1 });
eventInventoryItemSchema.index({ eventId: 1, category: 1 });

const EventInventoryItem =
  mongoose.models.EventInventoryItem || mongoose.model("EventInventoryItem", eventInventoryItemSchema);

export default EventInventoryItem;
