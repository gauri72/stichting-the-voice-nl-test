import mongoose from "mongoose";
import {
  DONOR_TYPES,
  DONATION_TYPES,
  DONATION_STATUSES,
  PAYMENT_STATUSES,
  RECEIPT_STATUSES,
  RECURRING_STATUSES,
  RECURRING_FREQUENCIES,
  DEFAULT_CURRENCY,
} from "../config/sponsorshipDonationConfig.js";

const internalNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const donationSchema = new mongoose.Schema(
  {
    donationId: { type: String, unique: true, sparse: true, trim: true, index: true },
    donorType: { type: String, enum: DONOR_TYPES, default: "individual" },
    donorName: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    address: { type: String, default: "", trim: true, maxlength: 500 },
    country: { type: String, default: "", trim: true, maxlength: 80 },
    isAnonymous: { type: Boolean, default: false },
    newsletterOptIn: { type: Boolean, default: false },
    donationType: {
      type: String,
      enum: DONATION_TYPES,
      default: "one_time",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: DEFAULT_CURRENCY, uppercase: true, trim: true },
    campaignName: { type: String, default: "", trim: true, maxlength: 160, index: true },
    paymentMethod: { type: String, default: "", trim: true },
    paymentStatus: {
      type: String,
      enum: DONATION_STATUSES,
      default: "pending",
      index: true,
    },
    paymentReference: { type: String, default: "", trim: true, index: true },
    paymentDate: { type: Date, default: null },
    donationDate: { type: Date, default: () => new Date() },
    recurringStatus: {
      type: String,
      enum: RECURRING_STATUSES,
      default: "not_recurring",
      index: true,
    },
    recurringFrequency: {
      type: String,
      enum: RECURRING_FREQUENCIES,
      default: "",
    },
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
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    internalNotes: [internalNoteSchema],
    addToMailingList: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "donations" }
);

donationSchema.index({ paymentStatus: 1, donationType: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ donorName: "text", email: "text", campaignName: "text" });

const Donation = mongoose.models.Donation || mongoose.model("Donation", donationSchema);

export default Donation;
