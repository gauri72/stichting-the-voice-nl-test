import mongoose from "mongoose";

const receiptLogSchema = new mongoose.Schema(
  {
    receiptLogId: { type: String, unique: true, sparse: true, trim: true, index: true },
    moduleType: { type: String, enum: ["sponsorship", "donation"], required: true, index: true },
    recordId: { type: String, required: true, index: true },
    receiptNumber: { type: String, required: true, trim: true },
    recipientEmail: { type: String, default: "", lowercase: true, trim: true },
    sentAt: { type: Date, default: null },
    resentAt: { type: Date, default: null },
    resentCount: { type: Number, default: 0, min: 0 },
    downloadedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["generated", "sent", "resent", "downloaded"],
      default: "generated",
    },
  },
  { timestamps: true, collection: "receipt_logs" }
);

receiptLogSchema.index({ moduleType: 1, recordId: 1 });

const ReceiptLog =
  mongoose.models.ReceiptLog || mongoose.model("ReceiptLog", receiptLogSchema);

export default ReceiptLog;
