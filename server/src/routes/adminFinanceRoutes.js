import { Router } from "express";
import {
  invoiceDashboard,
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  duplicateInvoice,
  sendInvoice,
  resendInvoice,
  markInvoicePaid,
  markInvoiceOverdue,
  cancelInvoice,
  downloadInvoicePdf,
  previewInvoicePdf,
  exportInvoices,
  budgetDashboard,
  listEventBudgets,
  getEventBudget,
  createEventBudget,
  updateEventBudget,
  deleteEventBudget,
  duplicateEventBudget,
  approveEventBudget,
  finalizeEventBudget,
  archiveEventBudget,
  importBudgetExpenses,
  exportBudgetPdf,
  exportBudgetExcel,
  exportBudgets,
  transactionDashboard,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  listAuditReports,
  getAuditReport,
  generateAuditReport,
  downloadAuditReportPdf,
  downloadAuditReportExcel,
  listFinanceAuditLogs,
  financeDashboard,
  financialReportsSummary,
  getFinanceSettings,
  updateFinanceSettings,
} from "../controllers/adminFinanceController.js";
import { requireFinancePermission, requireFinanceDelete } from "../middleware/financeMiddleware.js";

const router = Router();

router.get("/dashboard", requireFinancePermission("reports.read"), financeDashboard);
router.get("/reports/summary", requireFinancePermission("reports.read"), financialReportsSummary);

router.get("/settings", requireFinancePermission("settings.read"), getFinanceSettings);
router.patch("/settings", requireFinancePermission("settings.write"), updateFinanceSettings);

router.get("/audit-logs", requireFinancePermission("audit.read"), listFinanceAuditLogs);

// Invoices
router.get("/invoices/dashboard", requireFinancePermission("invoices.read"), invoiceDashboard);
router.get("/invoices/export", requireFinancePermission("invoices.read"), exportInvoices);
router.get("/invoices", requireFinancePermission("invoices.read"), listInvoices);
router.post("/invoices", requireFinancePermission("invoices.write"), createInvoice);
router.post("/invoices/preview-pdf", requireFinancePermission("invoices.write"), previewInvoicePdf);
router.get("/invoices/:id/download-pdf", requireFinancePermission("invoices.read"), downloadInvoicePdf);
router.post("/invoices/:id/send", requireFinancePermission("invoices.send"), sendInvoice);
router.post("/invoices/:id/resend", requireFinancePermission("invoices.send"), resendInvoice);
router.post("/invoices/:id/mark-paid", requireFinancePermission("invoices.write"), markInvoicePaid);
router.post("/invoices/:id/mark-overdue", requireFinancePermission("invoices.write"), markInvoiceOverdue);
router.post("/invoices/:id/cancel", requireFinancePermission("invoices.write"), cancelInvoice);
router.post("/invoices/:id/duplicate", requireFinancePermission("invoices.write"), duplicateInvoice);
router.get("/invoices/:id", requireFinancePermission("invoices.read"), getInvoice);
router.patch("/invoices/:id", requireFinancePermission("invoices.write"), updateInvoice);
router.delete("/invoices/:id", requireFinanceDelete, deleteInvoice);

// Event Budgets
router.get("/event-budgets/dashboard", requireFinancePermission("budgets.read"), budgetDashboard);
router.get("/event-budgets/export", requireFinancePermission("budgets.read"), exportBudgets);
router.get("/event-budgets", requireFinancePermission("budgets.read"), listEventBudgets);
router.post("/event-budgets", requireFinancePermission("budgets.write"), createEventBudget);
router.get("/event-budgets/:id/export-pdf", requireFinancePermission("budgets.read"), exportBudgetPdf);
router.get("/event-budgets/:id/export-excel", requireFinancePermission("budgets.read"), exportBudgetExcel);
router.post("/event-budgets/:id/approve", requireFinancePermission("budgets.approve"), approveEventBudget);
router.post("/event-budgets/:id/finalize", requireFinancePermission("budgets.approve"), finalizeEventBudget);
router.post("/event-budgets/:id/archive", requireFinancePermission("budgets.write"), archiveEventBudget);
router.post("/event-budgets/:id/duplicate", requireFinancePermission("budgets.write"), duplicateEventBudget);
router.post("/event-budgets/:id/import-expenses", requireFinancePermission("budgets.write"), importBudgetExpenses);
router.get("/event-budgets/:id", requireFinancePermission("budgets.read"), getEventBudget);
router.patch("/event-budgets/:id", requireFinancePermission("budgets.write"), updateEventBudget);
router.delete("/event-budgets/:id", requireFinanceDelete, deleteEventBudget);

// Transactions
router.get("/transactions/dashboard", requireFinancePermission("transactions.read"), transactionDashboard);
router.get("/transactions/export", requireFinancePermission("transactions.read"), exportTransactions);
router.get("/transactions", requireFinancePermission("transactions.read"), listTransactions);
router.post("/transactions", requireFinancePermission("transactions.write"), createTransaction);
router.get("/transactions/:id", requireFinancePermission("transactions.read"), getTransaction);
router.patch("/transactions/:id", requireFinancePermission("transactions.write"), updateTransaction);
router.delete("/transactions/:id", requireFinanceDelete, deleteTransaction);

// Audit Reports
router.get("/audit-reports", requireFinancePermission("reports.read"), listAuditReports);
router.post("/audit-reports/generate", requireFinancePermission("reports.generate"), generateAuditReport);
router.get("/audit-reports/:id/download-pdf", requireFinancePermission("reports.read"), downloadAuditReportPdf);
router.get("/audit-reports/:id/download-excel", requireFinancePermission("reports.read"), downloadAuditReportExcel);
router.get("/audit-reports/:id", requireFinancePermission("reports.read"), getAuditReport);

export default router;
