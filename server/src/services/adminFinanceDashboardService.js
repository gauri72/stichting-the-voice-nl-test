import { getInvoiceDashboardStats } from "./adminInvoiceService.js";
import { getBudgetDashboardStats } from "./adminEventBudgetService.js";
import { getTransactionDashboardStats } from "./adminFinanceTransactionService.js";
import { getAuditReportDashboardStats } from "./adminAuditReportService.js";
import EventBudget from "../models/EventBudget.js";

export async function getFinanceDashboardStats() {
  const [invoiceStats, budgetStats, transactionStats, auditStats, missingReceipts] = await Promise.all([
    getInvoiceDashboardStats(),
    getBudgetDashboardStats(),
    getTransactionDashboardStats(),
    getAuditReportDashboardStats(),
    EventBudget.aggregate([
      { $unwind: "$expenseLines" },
      { $match: { "expenseLines.receiptAttached": { $ne: true }, "expenseLines.actualAmount": { $gt: 0 } } },
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
