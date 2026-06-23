import mongoose from "mongoose";
import { DOCUMENT_CATEGORIES, DOCUMENT_VISIBILITY } from "../config/eventOperationsConfig.js";

const eventDocumentSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    documentName: { type: String, required: true, trim: true, maxlength: 300, index: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, default: "Other", index: true },
    fileType: { type: String, default: "", trim: true, maxlength: 120 },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, default: "", trim: true, maxlength: 120 },
    fileSize: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    uploadedByName: { type: String, default: "", trim: true, maxlength: 200 },
    uploadedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    currentVersion: { type: Number, default: 1 },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    visibility: { type: String, enum: DOCUMENT_VISIBILITY, default: "Internal" },
    linkedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: "EventVendor", default: null },
    linkedSponsorId: { type: String, default: "", trim: true, maxlength: 100 },
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "event_documents" }
);

eventDocumentSchema.index({ eventId: 1, category: 1, archived: 1 });
eventDocumentSchema.index({ documentName: "text", tags: "text", notes: "text" });

const EventDocument = mongoose.models.EventDocument || mongoose.model("EventDocument", eventDocumentSchema);

export default EventDocument;
