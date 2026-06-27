import mongoose from "mongoose";
import {
  BUDGET_STATUSES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_STATUSES,
} from "../config/financeConfig.js";

const incomeLineSchema = new mongoose.Schema(
  {
    category: { type: String, enum: INCOME_CATEGORIES, default: "other_income" },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    plannedAmount: { type: Number, default: 0, min: 0 },
    actualAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, default: "pending", trim: true },
    sourceModule: { type: String, default: "", trim: true },
    linkedRecordId: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { _id: true }
);

const expenseLineSchema = new mongoose.Schema(
  {
    category: { type: String, enum: EXPENSE_CATEGORIES, default: "miscellaneous" },
    vendorPayee: { type: String, default: "", trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    plannedAmount: { type: Number, default: 0, min: 0 },
    actualAmount: { type: Number, default: 0, min: 0 },
    vatRate: { type: Number, default: 21, min: 0 },
    paymentStatus: { type: String, enum: EXPENSE_PAYMENT_STATUSES, default: "planned" },
    receiptAttached: { type: Boolean, default: false },
    invoiceAttached: { type: Boolean, default: false },
    receiptUrl: { type: String, default: "" },
    invoiceUrl: { type: String, default: "" },
    paymentDate: { type: Date, default: null },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    url: { type: String, default: "" },
    uploadedAt: { type: Date, default: () => new Date() },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { _id: true }
);

const approvalEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    byName: { type: String, default: "", trim: true },
    at: { type: Date, default: () => new Date() },
    notes: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const eventBudgetSchema = new mongoose.Schema(
  {
    budgetId: { type: String, unique: true, sparse: true, trim: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    eventName: { type: String, default: "", trim: true, index: true },
    eventDate: { type: Date, default: null, index: true },
    venue: { type: String, default: "", trim: true },
    status: { type: String, enum: BUDGET_STATUSES, default: "draft", index: true },
    expectedAttendance: { type: Number, default: 0, min: 0 },
    actualAttendance: { type: Number, default: 0, min: 0 },
    incomeLines: { type: [incomeLineSchema], default: [] },
    expenseLines: { type: [expenseLineSchema], default: [] },
    plannedIncomeTotal: { type: Number, default: 0, min: 0 },
    actualIncomeTotal: { type: Number, default: 0, min: 0 },
    plannedExpenseTotal: { type: Number, default: 0, min: 0 },
    actualExpenseTotal: { type: Number, default: 0, min: 0 },
    plannedNetResult: { type: Number, default: 0 },
    actualNetResult: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    incomeVariance: { type: Number, default: 0 },
    expenseVariance: { type: Number, default: 0 },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    approvedAt: { type: Date, default: null },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    finalizedAt: { type: Date, default: null },
    attachments: { type: [attachmentSchema], default: [] },
    approvalHistory: { type: [approvalEntrySchema], default: [] },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "event_budgets" }
);

const EventBudget = mongoose.models.EventBudget || mongoose.model("EventBudget", eventBudgetSchema);

export default EventBudget;
