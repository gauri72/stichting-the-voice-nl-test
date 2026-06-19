import FinanceTransaction from "../models/FinanceTransaction.js";
import Event from "../models/Event.js";
import {
  formatMoney,
  formatDateShort,
  nextFinanceId,
  throwFinanceError,
  csvEscape,
} from "../utils/financeUtils.js";
import { logFinanceAction } from "./financeAuditService.js";

function formatTransaction(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    transactionId: doc.transactionId,
    type: doc.type,
    category: doc.category,
    description: doc.description,
    relatedEventId: doc.relatedEventId?.toString() || null,
    relatedEventName: doc.relatedEventName,
    relatedModule: doc.relatedModule,
    relatedRecordId: doc.relatedRecordId,
    amount: doc.amount,
    amountFormatted: formatMoney(Math.abs(doc.amount)),
    vatAmount: doc.vatAmount,
    vatAmountFormatted: formatMoney(doc.vatAmount),
    currency: doc.currency,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    paymentReference: doc.paymentReference,
    transactionDate: doc.transactionDate,
    receiptUrl: doc.receiptUrl,
    invoiceUrl: doc.invoiceUrl,
    budgetId: doc.budgetId?.toString() || null,
    notes: doc.notes,
    createdBy: doc.createdBy?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildTransactionFilter(params) {
  const filter = {};
  if (params.type) filter.type = params.type;
  if (params.category) filter.category = params.category;
  if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;
  if (params.relatedModule) filter.relatedModule = params.relatedModule;
  if (params.eventId) filter.relatedEventId = params.eventId;
  if (params.dateFrom || params.dateTo) {
    filter.transactionDate = {};
    if (params.dateFrom) filter.transactionDate.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.transactionDate.$lte = end;
    }
  }
  if (params.search) {
    const q = params.search.trim();
    filter.$or = [
      { description: new RegExp(q, "i") },
      { paymentReference: new RegExp(q, "i") },
      { category: new RegExp(q, "i") },
      { transactionId: new RegExp(q, "i") },
    ];
  }
  return filter;
}

function normalizeAmount(val, type) {
  let amount = Math.round(Number(val) * 100) || Math.round(Number(val)) || 0;
  if (type === "expense" || type === "refund") amount = -Math.abs(amount);
  else amount = Math.abs(amount);
  return amount;
}

export async function getTransactionDashboardStats() {
  const [incomeAgg, expenseAgg, count] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: { type: "income", paymentStatus: { $in: ["paid", "received"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { type: "expense", paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
    ]),
    FinanceTransaction.countDocuments({}),
  ]);
  const income = incomeAgg[0]?.total || 0;
  const expenses = expenseAgg[0]?.total || 0;
  return {
    totalTransactions: count,
    totalIncome: formatMoney(income),
    totalExpenses: formatMoney(expenses),
    netResult: formatMoney(income - expenses),
    totalIncomeMinor: income,
    totalExpensesMinor: expenses,
  };
}

export async function listTransactions(params = {}) {
  const filter = buildTransactionFilter(params);
  const docs = await FinanceTransaction.find(filter).sort({ transactionDate: -1 }).limit(500).lean();
  return docs.map(formatTransaction);
}

export async function getTransactionById(id) {
  const doc = await FinanceTransaction.findById(id).lean();
  if (!doc) throwFinanceError("Transaction not found.", 404);
  return formatTransaction(doc);
}

export async function createTransaction(data, admin, req) {
  const transactionId = await nextFinanceId("TXN");
  let relatedEventName = data.relatedEventName || "";
  if (data.relatedEventId) {
    const event = await Event.findById(data.relatedEventId).select("title name").lean();
    relatedEventName = event?.title || event?.name || relatedEventName;
  }

  const doc = await FinanceTransaction.create({
    transactionId,
    type: data.type || "income",
    category: data.category || "",
    description: data.description || "",
    relatedEventId: data.relatedEventId || null,
    relatedEventName,
    relatedModule: data.relatedModule || "manual",
    relatedRecordId: data.relatedRecordId || "",
    amount: normalizeAmount(data.amount, data.type),
    vatAmount: Math.round(Number(data.vatAmount) * 100) || Math.round(Number(data.vatAmount)) || 0,
    currency: data.currency || "EUR",
    paymentStatus: data.paymentStatus || "pending",
    paymentMethod: data.paymentMethod || "",
    paymentReference: data.paymentReference || "",
    transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
    receiptUrl: data.receiptUrl || "",
    invoiceUrl: data.invoiceUrl || "",
    budgetId: data.budgetId || null,
    notes: data.notes || "",
    createdBy: admin?.id || admin?._id,
  });

  await logFinanceAction({
    admin,
    action: "transaction_created",
    entityType: "transaction",
    entityId: doc.transactionId,
    newValue: formatTransaction(doc.toObject()),
    req,
  });
  return formatTransaction(doc.toObject());
}

export async function updateTransaction(id, data, admin, req) {
  const doc = await FinanceTransaction.findById(id);
  if (!doc) throwFinanceError("Transaction not found.", 404);
  const oldValue = formatTransaction(doc.toObject());

  const fields = [
    "type", "category", "description", "relatedModule", "relatedRecordId", "currency",
    "paymentStatus", "paymentMethod", "paymentReference", "receiptUrl", "invoiceUrl", "budgetId", "notes",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) doc[f] = data[f];
  }
  if (data.amount !== undefined) doc.amount = normalizeAmount(data.amount, doc.type);
  if (data.vatAmount !== undefined) {
    doc.vatAmount = Math.round(Number(data.vatAmount) * 100) || Math.round(Number(data.vatAmount)) || 0;
  }
  if (data.transactionDate) doc.transactionDate = new Date(data.transactionDate);
  if (data.relatedEventId !== undefined) {
    doc.relatedEventId = data.relatedEventId || null;
    if (data.relatedEventId) {
      const event = await Event.findById(data.relatedEventId).select("title name").lean();
      doc.relatedEventName = event?.title || event?.name || "";
    }
  }

  await doc.save();
  await logFinanceAction({
    admin,
    action: "transaction_updated",
    entityType: "transaction",
    entityId: doc.transactionId,
    oldValue,
    newValue: formatTransaction(doc.toObject()),
    req,
  });
  return formatTransaction(doc.toObject());
}

export async function deleteTransaction(id, admin, req) {
  const doc = await FinanceTransaction.findById(id);
  if (!doc) throwFinanceError("Transaction not found.", 404);
  await logFinanceAction({
    admin,
    action: "transaction_deleted",
    entityType: "transaction",
    entityId: doc.transactionId,
    oldValue: formatTransaction(doc.toObject()),
    req,
  });
  await FinanceTransaction.deleteOne({ _id: id });
  return { success: true };
}

export function transactionsToCsv(rows) {
  const headers = [
    "Date", "Type", "Category", "Description", "Event", "Module", "Amount", "VAT",
    "Status", "Method", "Reference",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        formatDateShort(r.transactionDate), r.type, r.category, r.description, r.relatedEventName,
        r.relatedModule, r.amountFormatted, r.vatAmountFormatted, r.paymentStatus,
        r.paymentMethod, r.paymentReference,
      ].map(csvEscape).join(",")
    );
  }
  return lines.join("\n");
}

export async function exportTransactions(params) {
  const rows = await listTransactions(params);
  return { content: transactionsToCsv(rows), filename: "transactions-export.csv" };
}
