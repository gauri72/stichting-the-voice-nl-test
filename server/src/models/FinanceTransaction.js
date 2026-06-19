import mongoose from "mongoose";
import {
  TRANSACTION_TYPES,
  TRANSACTION_MODULES,
  EXPENSE_PAYMENT_STATUSES,
} from "../config/financeConfig.js";

const financeTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, sparse: true, trim: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, default: "income", index: true },
    category: { type: String, default: "", trim: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    relatedEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    relatedEventName: { type: String, default: "", trim: true },
    relatedModule: { type: String, enum: [...TRANSACTION_MODULES, ""], default: "manual" },
    relatedRecordId: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "EUR", trim: true },
    paymentStatus: { type: String, enum: [...EXPENSE_PAYMENT_STATUSES, "received", "refunded"], default: "pending" },
    paymentMethod: { type: String, default: "", trim: true },
    paymentReference: { type: String, default: "", trim: true },
    transactionDate: { type: Date, default: () => new Date(), index: true },
    receiptUrl: { type: String, default: "" },
    invoiceUrl: { type: String, default: "" },
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: "EventBudget", default: null },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "finance_transactions" }
);

financeTransactionSchema.index({ description: "text", paymentReference: "text", category: "text" });

const FinanceTransaction =
  mongoose.models.FinanceTransaction || mongoose.model("FinanceTransaction", financeTransactionSchema);

export default FinanceTransaction;
