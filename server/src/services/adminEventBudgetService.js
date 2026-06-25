import EventBudget from "../models/EventBudget.js";
import Event from "../models/Event.js";
import Donation from "../models/Donation.js";
import Sponsorship from "../models/Sponsorship.js";
import TicketOrder from "../models/TicketOrder.js";
import {
  formatMoney,
  formatDate,
  formatDateShort,
  nextFinanceId,
  computeBudgetTotals,
  throwFinanceError,
  csvEscape,
} from "../utils/financeUtils.js";
import { logFinanceAction, getAuditLogsForEntity } from "./financeAuditService.js";
import { renderBudgetPdf } from "./financePdfService.js";
import { buildBudgetExcel } from "./financeExcelService.js";
import { escapeRegex } from "../utils/regexUtils.js";

function formatBudget(doc) {
  if (!doc) return null;
  const totals = computeBudgetTotals(doc);
  const id = doc._id.toString();
  return {
    id,
    budgetId: doc.budgetId,
    eventId: doc.eventId?.toString() || null,
    eventName: doc.eventName,
    eventDate: doc.eventDate,
    venue: doc.venue,
    status: doc.status,
    expectedAttendance: doc.expectedAttendance,
    actualAttendance: doc.actualAttendance,
    plannedIncomeLines: doc.plannedIncomeLines || [],
    actualIncomeLines: doc.actualIncomeLines || [],
    plannedExpenseLines: doc.plannedExpenseLines || [],
    actualExpenseLines: doc.actualExpenseLines || [],
    ...totals,
    plannedIncomeTotalFormatted: formatMoney(totals.plannedIncomeTotal),
    actualIncomeTotalFormatted: formatMoney(totals.actualIncomeTotal),
    plannedExpenseTotalFormatted: formatMoney(totals.plannedExpenseTotal),
    actualExpenseTotalFormatted: formatMoney(totals.actualExpenseTotal),
    plannedNetResultFormatted: formatMoney(totals.plannedNetResult),
    actualNetResultFormatted: formatMoney(totals.actualNetResult),
    varianceFormatted: formatMoney(totals.variance),
    incomeVarianceFormatted: formatMoney(totals.incomeVariance),
    expenseVarianceFormatted: formatMoney(totals.expenseVariance),
    approvedBy: doc.approvedBy?.toString() || null,
    approvedAt: doc.approvedAt,
    finalizedBy: doc.finalizedBy?.toString() || null,
    finalizedAt: doc.finalizedAt,
    attachments: doc.attachments || [],
    approvalHistory: doc.approvalHistory || [],
    notes: doc.notes,
    createdBy: doc.createdBy?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastUpdated: doc.updatedAt,
  };
}

function buildBudgetFilter(params) {
  const filter = {};
  if (params.status) filter.status = params.status;
  if (params.eventId) filter.eventId = params.eventId;
  if (params.search) {
    const q = escapeRegex(params.search.trim());
    filter.$or = [{ eventName: new RegExp(q, "i") }, { budgetId: new RegExp(q, "i") }];
  }
  if (params.dateFrom || params.dateTo) {
    filter.eventDate = {};
    if (params.dateFrom) filter.eventDate.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.eventDate.$lte = end;
    }
  }
  return filter;
}

function applyTotals(doc) {
  const totals = computeBudgetTotals(doc);
  Object.assign(doc, totals);
  return doc;
}

export async function getBudgetDashboardStats() {
  const budgets = await EventBudget.find({ status: { $ne: "archived" } }).lean();
  let plannedIncome = 0;
  let actualIncome = 0;
  let plannedExpenses = 0;
  let actualExpenses = 0;
  for (const b of budgets) {
    const t = computeBudgetTotals(b);
    plannedIncome += t.plannedIncomeTotal;
    actualIncome += t.actualIncomeTotal;
    plannedExpenses += t.plannedExpenseTotal;
    actualExpenses += t.actualExpenseTotal;
  }
  return {
    totalEventsBudgeted: budgets.length,
    plannedIncome: formatMoney(plannedIncome),
    actualIncome: formatMoney(actualIncome),
    plannedExpenses: formatMoney(plannedExpenses),
    actualExpenses: formatMoney(actualExpenses),
    netResult: formatMoney(actualIncome - actualExpenses),
    budgetVariance: formatMoney(actualIncome - actualExpenses - (plannedIncome - plannedExpenses)),
    plannedIncomeMinor: plannedIncome,
    actualIncomeMinor: actualIncome,
    plannedExpensesMinor: plannedExpenses,
    actualExpensesMinor: actualExpenses,
  };
}

export async function listEventBudgets(params = {}) {
  const filter = buildBudgetFilter(params);
  const docs = await EventBudget.find(filter).sort({ eventDate: -1 }).limit(200).lean();
  return docs.map(formatBudget);
}

export async function getEventBudgetById(id) {
  const doc = await EventBudget.findById(id).lean();
  if (!doc) throwFinanceError("Budget not found.", 404);
  const auditLogs = await getAuditLogsForEntity(doc.budgetId || doc._id.toString());
  return { budget: formatBudget(doc), auditLogs };
}

export async function createEventBudget(data, admin, req) {
  const budgetId = await nextFinanceId("BUD");
  let eventName = data.eventName || "";
  let eventDate = data.eventDate ? new Date(data.eventDate) : null;
  let venue = data.venue || "";

  if (data.eventId) {
    const event = await Event.findById(data.eventId).lean();
    if (event) {
      eventName = event.title || event.name || eventName;
      eventDate = event.startDate || event.date || eventDate;
      venue = event.venue || event.location || venue;
    }
  }

  const doc = await EventBudget.create({
    budgetId,
    eventId: data.eventId || null,
    eventName,
    eventDate,
    venue,
    status: "draft",
    expectedAttendance: Number(data.expectedAttendance) || 0,
    actualAttendance: Number(data.actualAttendance) || 0,
    plannedIncomeLines: data.plannedIncomeLines || [],
    actualIncomeLines: data.actualIncomeLines || [],
    plannedExpenseLines: data.plannedExpenseLines || [],
    actualExpenseLines: data.actualExpenseLines || [],
    notes: data.notes || "",
    createdBy: admin?.id || admin?._id,
  });
  applyTotals(doc);
  await doc.save();

  await logFinanceAction({
    admin,
    action: "budget_created",
    entityType: "event_budget",
    entityId: doc.budgetId,
    newValue: { eventName: doc.eventName },
    req,
  });
  return formatBudget(doc.toObject());
}

export async function updateEventBudget(id, data, admin, req) {
  const doc = await EventBudget.findById(id);
  if (!doc) throwFinanceError("Budget not found.", 404);
  if (doc.status === "finalized" && admin?.role !== "superadmin") {
    throwFinanceError("Finalized budgets cannot be edited. Contact Super Admin to reopen.", 403);
  }

  const oldValue = formatBudget(doc.toObject());
  const fields = [
    "eventName", "venue", "status", "expectedAttendance", "actualAttendance", "notes",
    "plannedIncomeLines", "actualIncomeLines", "plannedExpenseLines", "actualExpenseLines", "attachments",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) doc[f] = data[f];
  }
  if (data.eventDate) doc.eventDate = new Date(data.eventDate);
  if (data.eventId) doc.eventId = data.eventId;

  applyTotals(doc);
  await doc.save();

  await logFinanceAction({
    admin,
    action: "budget_updated",
    entityType: "event_budget",
    entityId: doc.budgetId,
    oldValue,
    newValue: formatBudget(doc.toObject()),
    req,
  });
  return formatBudget(doc.toObject());
}

export async function duplicateEventBudget(id, admin, req) {
  const original = await EventBudget.findById(id).lean();
  if (!original) throwFinanceError("Budget not found.", 404);
  return createEventBudget(
    {
      eventId: original.eventId,
      eventName: `${original.eventName} (Copy)`,
      eventDate: original.eventDate,
      venue: original.venue,
      expectedAttendance: original.expectedAttendance,
      plannedIncomeLines: original.plannedIncomeLines,
      plannedExpenseLines: original.plannedExpenseLines,
      actualIncomeLines: [],
      actualExpenseLines: [],
      notes: original.notes,
    },
    admin,
    req
  );
}

export async function approveEventBudget(id, admin, req) {
  const doc = await EventBudget.findById(id);
  if (!doc) throwFinanceError("Budget not found.", 404);
  doc.status = "approved";
  doc.approvedBy = admin?.id || admin?._id;
  doc.approvedAt = new Date();
  doc.approvalHistory.push({
    action: "approved",
    by: admin?.id || admin?._id,
    byName: admin ? `${admin.firstName || ""} ${admin.lastName || ""}`.trim() : "",
    notes: "Budget approved",
  });
  await doc.save();
  await logFinanceAction({ admin, action: "budget_approved", entityType: "event_budget", entityId: doc.budgetId, req });
  return formatBudget(doc.toObject());
}

export async function finalizeEventBudget(id, admin, req) {
  const doc = await EventBudget.findById(id);
  if (!doc) throwFinanceError("Budget not found.", 404);
  doc.status = "finalized";
  doc.finalizedBy = admin?.id || admin?._id;
  doc.finalizedAt = new Date();
  doc.approvalHistory.push({
    action: "finalized",
    by: admin?.id || admin?._id,
    byName: admin ? `${admin.firstName || ""} ${admin.lastName || ""}`.trim() : "",
    notes: "Budget finalized",
  });
  await doc.save();
  await logFinanceAction({ admin, action: "budget_finalized", entityType: "event_budget", entityId: doc.budgetId, req });
  return formatBudget(doc.toObject());
}

export async function archiveEventBudget(id, admin, req) {
  return updateEventBudget(id, { status: "archived" }, admin, req);
}

export async function deleteEventBudget(id, admin, req) {
  const doc = await EventBudget.findById(id);
  if (!doc) throwFinanceError("Budget not found.", 404);
  await EventBudget.deleteOne({ _id: id });
  await logFinanceAction({
    admin,
    action: "budget_updated",
    entityType: "event_budget",
    entityId: doc.budgetId,
    notes: "Budget deleted",
    req,
  });
  return { success: true };
}

export async function importExpensesFromModules(budgetId, admin, req) {
  const budget = await EventBudget.findById(budgetId);
  if (!budget) throwFinanceError("Budget not found.", 404);

  const eventFilter = budget.eventId ? { relatedEventId: budget.eventId } : {};
  const [donations, sponsorships, ticketOrders] = await Promise.all([
    Donation.find({ ...eventFilter, paymentStatus: "paid" }).lean(),
    Sponsorship.find({ ...eventFilter, paymentStatus: "paid" }).lean(),
    budget.eventId ? TicketOrder.find({ eventId: budget.eventId, status: "paid" }).lean() : [],
  ]);

  const incomeLines = [...(budget.actualIncomeLines || [])];
  for (const d of donations) {
    incomeLines.push({
      category: "donation_revenue",
      description: `Donation ${d.donationId}`,
      actualAmount: d.amount,
      paymentStatus: "paid",
      sourceModule: "donations",
      linkedRecordId: d.donationId,
    });
  }
  for (const s of sponsorships) {
    incomeLines.push({
      category: "sponsorship_revenue",
      description: `Sponsorship ${s.sponsorshipId}`,
      actualAmount: s.amount,
      paymentStatus: "paid",
      sourceModule: "sponsorships",
      linkedRecordId: s.sponsorshipId,
    });
  }
  for (const o of ticketOrders) {
    incomeLines.push({
      category: "ticket_sales",
      description: `Order ${o.orderNumber || o._id}`,
      actualAmount: o.totalAmount || o.amount || 0,
      paymentStatus: "paid",
      sourceModule: "tickets",
      linkedRecordId: o._id.toString(),
    });
  }

  budget.actualIncomeLines = incomeLines;
  applyTotals(budget);
  await budget.save();
  await logFinanceAction({
    admin,
    action: "budget_updated",
    entityType: "event_budget",
    entityId: budget.budgetId,
    notes: "Imported income from modules",
    req,
  });
  return formatBudget(budget.toObject());
}

async function buildBudgetExportPayload(budget) {
  const formatted = formatBudget(budget);
  const incomeLines = [
    ...(budget.plannedIncomeLines || []).map((l) => ({
      category: l.category,
      planned: formatMoney(l.plannedAmount),
      actual: formatMoney(
        budget.actualIncomeLines?.find((a) => a.category === l.category)?.actualAmount || l.actualAmount || 0
      ),
    })),
  ];
  const expenseLines = [
    ...(budget.plannedExpenseLines || []).map((l) => ({
      category: l.category,
      planned: formatMoney(l.plannedAmount),
      actual: formatMoney(
        budget.actualExpenseLines?.find((a) => a.category === l.category)?.actualAmount || l.actualAmount || 0
      ),
    })),
  ];
  return {
    payload: {
      eventName: budget.eventName,
      eventDate: formatDate(budget.eventDate),
      venue: budget.venue,
      status: budget.status,
      incomeLines,
      expenseLines,
      plannedNetResult: formatted.plannedNetResultFormatted,
      actualNetResult: formatted.actualNetResultFormatted,
      variance: formatted.varianceFormatted,
      approvalSection: (budget.approvalHistory || [])
        .map((h) => `${h.action} by ${h.byName} on ${formatDateShort(h.at)}`)
        .join("\n"),
    },
    formatted,
  };
}

export async function exportBudgetPdf(id) {
  const doc = await EventBudget.findById(id).lean();
  if (!doc) throwFinanceError("Budget not found.", 404);
  const { payload } = await buildBudgetExportPayload(doc);
  const pdf = await renderBudgetPdf(payload);
  return { pdf, filename: `budget-${doc.budgetId || doc.eventName}.pdf` };
}

export async function exportBudgetExcel(id) {
  const doc = await EventBudget.findById(id).lean();
  if (!doc) throwFinanceError("Budget not found.", 404);
  const { formatted } = await buildBudgetExportPayload(doc);
  const buffer = await buildBudgetExcel(doc, {
    ...formatted,
    eventDate: formatDate(doc.eventDate),
    avgRevenuePerAttendee: formatMoney(formatted.avgRevenuePerAttendee),
    avgCostPerAttendee: formatMoney(formatted.avgCostPerAttendee),
  });
  return { buffer, filename: `budget-${doc.budgetId}.xlsx` };
}

export function budgetsToCsv(rows) {
  const headers = [
    "Event", "Date", "Status", "Planned Income", "Actual Income", "Planned Expenses",
    "Actual Expenses", "Net Result", "Variance",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.eventName, formatDateShort(r.eventDate), r.status, r.plannedIncomeTotalFormatted,
        r.actualIncomeTotalFormatted, r.plannedExpenseTotalFormatted, r.actualExpenseTotalFormatted,
        r.actualNetResultFormatted, r.varianceFormatted,
      ].map(csvEscape).join(",")
    );
  }
  return lines.join("\n");
}

export async function exportBudgets(params) {
  const rows = await listEventBudgets(params);
  return { content: budgetsToCsv(rows), filename: "event-budgets.csv" };
}
