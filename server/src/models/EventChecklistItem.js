import mongoose from "mongoose";
import { CHECKLIST_CATEGORIES, CHECKLIST_STATUSES } from "../config/eventOperationsConfig.js";

const eventChecklistItemSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    task: { type: String, required: true, trim: true, maxlength: 500 },
    category: { type: String, enum: CHECKLIST_CATEGORIES, default: "Other", index: true },
    assignedTo: { type: String, default: "", trim: true, maxlength: 200 },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: CHECKLIST_STATUSES, default: "Open", index: true },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "event_checklist_items" }
);

eventChecklistItemSchema.index({ eventId: 1, status: 1 });

const EventChecklistItem =
  mongoose.models.EventChecklistItem || mongoose.model("EventChecklistItem", eventChecklistItemSchema);

export default EventChecklistItem;
