import mongoose from "mongoose";

const documentVersionSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "EventDocument", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    version: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    uploadedByName: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    changeNote: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: "document_versions" }
);

documentVersionSchema.index({ documentId: 1, version: -1 });

const DocumentVersion =
  mongoose.models.DocumentVersion || mongoose.model("DocumentVersion", documentVersionSchema);

export default DocumentVersion;
