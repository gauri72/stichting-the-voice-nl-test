import mongoose from "mongoose";
import {
  GLOBAL_INVENTORY_OWNERSHIP,
  GLOBAL_INVENTORY_STATUSES,
  INVENTORY_CATEGORIES,
} from "../config/eventOperationsConfig.js";

const usageEntrySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    eventTitle: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    usedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const globalInventoryItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true, maxlength: 300, index: true },
    category: { type: String, enum: INVENTORY_CATEGORIES, default: "Miscellaneous", index: true },
    ownershipType: { type: String, enum: GLOBAL_INVENTORY_OWNERSHIP, default: "Owned" },
    quantityAvailable: { type: Number, default: 1, min: 0 },
    storageLocation: { type: String, default: "", trim: true, maxlength: 300 },
    defaultSupplier: { type: String, default: "", trim: true, maxlength: 200 },
    replacementCostMinor: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    imageUrl: { type: String, default: "" },
    condition: { type: String, default: "Good", trim: true, maxlength: 200 },
    status: { type: String, enum: GLOBAL_INVENTORY_STATUSES, default: "Available", index: true },
    usageHistory: { type: [usageEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "global_inventory_items" }
);

const GlobalInventoryItem =
  mongoose.models.GlobalInventoryItem || mongoose.model("GlobalInventoryItem", globalInventoryItemSchema);

export default GlobalInventoryItem;
