import mongoose from "mongoose";
import {
  SPONSOR_TYPES,
  SPONSORSHIP_STATUSES,
  PAYMENT_STATUSES,
  RECEIPT_STATUSES,
  FOLLOW_UP_STATUSES,
  DEFAULT_CURRENCY,
} from "../config/sponsorshipDonationConfig.js";

const internalNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const sponsorshipSchema = new mongoose.Schema(
  {
    sponsorshipId: { type: String, unique: true, sparse: true, trim: true, index: true },
    sponsorType: { type: String, enum: SPONSOR_TYPES, default: "company" },
    sponsorName: { type: String, required: true, trim: true, maxlength: 200 },
    companyName: { type: String, default: "", trim: true, maxlength: 200 },
    contactPerson: { type: String, default: "", trim: true, maxlength: 160 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    address: { type: String, default: "", trim: true, maxlength: 500 },
    vatNumber: { type: String, default: "", trim: true, maxlength: 40 },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    logoUrl: { type: String, default: "", trim: true },
    packageName: { type: String, default: "", trim: true, maxlength: 160 },
    packageBenefits: { type: String, default: "", trim: true, maxlength: 2000 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: DEFAULT_CURRENCY, uppercase: true, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    campaignName: { type: String, default: "", trim: true, maxlength: 160, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sponsorshipStatus: {
      type: String,
      enum: SPONSORSHIP_STATUSES,
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
      index: true,
    },
    paymentReference: { type: String, default: "", trim: true, index: true },
    paymentMethod: { type: String, default: "", trim: true },
    paymentDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    invoiceNumber: { type: String, default: "", trim: true, index: true },
    invoicePdfUrl: { type: String, default: "", trim: true },
    receiptNumber: { type: String, default: "", trim: true, unique: true, sparse: true },
    receiptPdfUrl: { type: String, default: "", trim: true },
    receiptStatus: {
      type: String,
      enum: RECEIPT_STATUSES,
      default: "not_sent",
      index: true,
    },
    receiptSentAt: { type: Date, default: null },
    receiptResentCount: { type: Number, default: 0, min: 0 },
    receiptDownloadedAt: { type: Date, default: null },
    lastReminderSentAt: { type: Date, default: null },
    followUpStatus: {
      type: String,
      enum: FOLLOW_UP_STATUSES,
      default: "no_follow_up",
      index: true,
    },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    internalNotes: [internalNoteSchema],
    addToMailingList: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    source: { type: String, default: "", trim: true, maxlength: 40 },
  },
  { timestamps: true, collection: "sponsorships" }
);

sponsorshipSchema.index({ sponsorshipStatus: 1, paymentStatus: 1 });
sponsorshipSchema.index({ createdAt: -1 });
sponsorshipSchema.index({ sponsorName: "text", companyName: "text", email: "text", contactPerson: "text" });

const Sponsorship =
  mongoose.models.Sponsorship || mongoose.model("Sponsorship", sponsorshipSchema);

export default Sponsorship;
