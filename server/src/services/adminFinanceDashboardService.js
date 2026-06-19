import { getInvoiceDashboardStats } from "./adminInvoiceService.js";
import { getBudgetDashboardStats } from "./adminEventBudgetService.js";
import { getTransactionDashboardStats } from "./adminFinanceTransactionService.js";
import { getAuditReportDashboardStats } from "./adminAuditReportService.js";
import Invoice from "../models/Invoice.js";
import EventBudget from "../models/EventBudget.js";
import { formatMoney } from "../utils/financeUtils.js";

export async function getFinanceDashboardStats() {
  const [invoiceStats, budgetStats, transactionStats, auditStats, missingReceipts] = await Promise.all([
    getInvoiceDashboardStats(),
    getBudgetDashboardStats(),
    getTransactionDashboardStats(),
    getAuditReportDashboardStats(),
    EventBudget.aggregate([
      { $unwind: "$actualExpenseLines" },
      { $match: { "actualExpenseLines.receiptAttached": { $ne: true }, "actualExpenseLines.actualAmount": { $gt: 0 } } },
      { $count: "count" },
    ]),
  ]);

  return {
    totalIncome: transactionStats.totalIncome,
    totalIncomeMinor: transactionStats.totalIncomeMinor,
    totalExpenses: transactionStats.totalExpenses,
    totalExpensesMinor: transactionStats.totalExpensesMinor,
    netResult: transactionStats.netResult,
    pendingInvoices: invoiceStats.pendingInvoices,
    overdueInvoices: invoiceStats.overdueInvoices,
    outstandingAmount: invoiceStats.outstandingAmount,
    eventBudgetVariance: budgetStats.budgetVariance,
    auditReportsGenerated: auditStats.auditReportsGenerated,
    receiptsMissing: missingReceipts[0]?.count || 0,
    invoiceStats,
    budgetStats,
    transactionStats,
  };
}

export async function getFinanceOverviewReport(params = {}) {
  const stats = await getFinanceDashboardStats();
  const recentInvoices = await Invoice.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select("invoiceNumber clientName totalAmount paymentStatus invoiceDate")
    .lean();

  return {
    ...stats,
    recentInvoices: recentInvoices.map((i) => ({
      id: i._id.toString(),
      invoiceNumber: i.invoiceNumber,
      clientName: i.clientName,
      total: formatMoney(i.totalAmount),
      paymentStatus: i.paymentStatus,
      invoiceDate: i.invoiceDate,
    })),
  };
}
