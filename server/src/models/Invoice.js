import mongoose from "mongoose";
import {
  INVOICE_CLIENT_TYPES,
  INVOICE_RELATED_TYPES,
  INVOICE_PAYMENT_STATUSES,
  INVOICE_SENT_STATUSES,
} from "../config/financeConfig.js";

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "", trim: true, maxlength: 500 },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    vatRate: { type: Number, default: 21, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, unique: true, sparse: true, trim: true, index: true },
    invoiceNumber: { type: String, unique: true, sparse: true, trim: true, index: true },
    clientType: { type: String, enum: INVOICE_CLIENT_TYPES, default: "individual" },
    clientName: { type: String, default: "", trim: true, maxlength: 200 },
    companyName: { type: String, default: "", trim: true, maxlength: 200 },
    contactPerson: { type: String, default: "", trim: true, maxlength: 200 },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true, maxlength: 500 },
    vatNumber: { type: String, default: "", trim: true },
    relatedType: { type: String, enum: INVOICE_RELATED_TYPES, default: "custom" },
    relatedEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    relatedEventName: { type: String, default: "", trim: true },
    relatedModule: { type: String, default: "", trim: true },
    relatedRecordId: { type: String, default: "", trim: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "EUR", trim: true },
    invoiceDate: { type: Date, default: () => new Date(), index: true },
    dueDate: { type: Date, default: null, index: true },
    paymentStatus: { type: String, enum: INVOICE_PAYMENT_STATUSES, default: "draft", index: true },
    sentStatus: { type: String, enum: INVOICE_SENT_STATUSES, default: "not_sent" },
    sentAt: { type: Date, default: null },
    resentCount: { type: Number, default: 0 },
    pdfUrl: { type: String, default: "" },
    paymentReference: { type: String, default: "", trim: true },
    paymentLink: { type: String, default: "" },
    attachTerms: { type: Boolean, default: true },
    footerNote: { type: String, default: "", trim: true, maxlength: 1000 },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "invoices" }
);

invoiceSchema.index({ clientName: "text", email: "text", invoiceNumber: "text", relatedEventName: "text" });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
