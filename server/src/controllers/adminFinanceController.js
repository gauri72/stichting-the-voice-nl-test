import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-finance]" });
}

function adminFromReq(req) {
  const a = req.admin;
  if (!a) return null;
  return {
    id: a.id || a._id?.toString(),
    _id: a._id,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    role: a.role,
  };
}

// Invoices
export async function invoiceDashboard(req, res) {
  try {
    const { getInvoiceDashboardStats } = await import("../services/adminInvoiceService.js");
    const stats = await getInvoiceDashboardStats();
    return res.json({ stats });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listInvoices(req, res) {
  try {
    const { listInvoices: list } = await import("../services/adminInvoiceService.js");
    const invoices = await list(req.query);
    return res.json({ invoices });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getInvoice(req, res) {
  try {
    const { getInvoiceById } = await import("../services/adminInvoiceService.js");
    const data = await getInvoiceById(req.params.id);
    return res.json(data);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createInvoice(req, res) {
  try {
    const { createInvoice: create } = await import("../services/adminInvoiceService.js");
    const invoice = await create(req.body, adminFromReq(req), req);
    return res.status(201).json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateInvoice(req, res) {
  try {
    const { updateInvoice: update } = await import("../services/adminInvoiceService.js");
    const invoice = await update(req.params.id, req.body, adminFromReq(req), req);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteInvoice(req, res) {
  try {
    const { deleteInvoice: del } = await import("../services/adminInvoiceService.js");
    await del(req.params.id, adminFromReq(req), req);
    return res.json({ success: true });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function duplicateInvoice(req, res) {
  try {
    const { duplicateInvoice: dup } = await import("../services/adminInvoiceService.js");
    const invoice = await dup(req.params.id, adminFromReq(req), req);
    return res.status(201).json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function sendInvoice(req, res) {
  try {
    const { sendInvoiceEmail } = await import("../services/adminInvoiceService.js");
    const invoice = await sendInvoiceEmail(req.params.id, adminFromReq(req), req, false);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function resendInvoice(req, res) {
  try {
    const { sendInvoiceEmail } = await import("../services/adminInvoiceService.js");
    const invoice = await sendInvoiceEmail(req.params.id, adminFromReq(req), req, true);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function markInvoicePaid(req, res) {
  try {
    const { markInvoicePaid: mark } = await import("../services/adminInvoiceService.js");
    const invoice = await mark(req.params.id, req.body, adminFromReq(req), req);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function markInvoiceOverdue(req, res) {
  try {
    const { markInvoiceOverdue: mark } = await import("../services/adminInvoiceService.js");
    const invoice = await mark(req.params.id, adminFromReq(req), req);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function cancelInvoice(req, res) {
  try {
    const { cancelInvoice: cancel } = await import("../services/adminInvoiceService.js");
    const invoice = await cancel(req.params.id, adminFromReq(req), req);
    return res.json({ invoice });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function downloadInvoicePdf(req, res) {
  try {
    const { downloadInvoicePdf: download } = await import("../services/adminInvoiceService.js");
    const { pdf, filename } = await download(req.params.id, adminFromReq(req), req);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function exportInvoices(req, res) {
  try {
    const { exportInvoices: exp } = await import("../services/adminInvoiceService.js");
    const format = req.query.format || "csv";
    const result = await exp(req.query, format);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer || result.content);
  } catch (e) {
    return handleError(res, e);
  }
}

// Event Budgets
export async function budgetDashboard(req, res) {
  try {
    const { getBudgetDashboardStats } = await import("../services/adminEventBudgetService.js");
    const stats = await getBudgetDashboardStats();
    return res.json({ stats });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listEventBudgets(req, res) {
  try {
    const { listEventBudgets: list } = await import("../services/adminEventBudgetService.js");
    const budgets = await list(req.query);
    return res.json({ budgets });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getEventBudget(req, res) {
  try {
    const { getEventBudgetById } = await import("../services/adminEventBudgetService.js");
    const data = await getEventBudgetById(req.params.id);
    return res.json(data);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createEventBudget(req, res) {
  try {
    const { createEventBudget: create } = await import("../services/adminEventBudgetService.js");
    const budget = await create(req.body, adminFromReq(req), req);
    return res.status(201).json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateEventBudget(req, res) {
  try {
    const { updateEventBudget: update } = await import("../services/adminEventBudgetService.js");
    const budget = await update(req.params.id, req.body, adminFromReq(req), req);
    return res.json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteEventBudget(req, res) {
  try {
    const { deleteEventBudget: del } = await import("../services/adminEventBudgetService.js");
    await del(req.params.id, adminFromReq(req), req);
    return res.json({ success: true });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function duplicateEventBudget(req, res) {
  try {
    const { duplicateEventBudget: dup } = await import("../services/adminEventBudgetService.js");
    const budget = await dup(req.params.id, adminFromReq(req), req);
    return res.status(201).json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function approveEventBudget(req, res) {
  try {
    const { approveEventBudget: approve } = await import("../services/adminEventBudgetService.js");
    const budget = await approve(req.params.id, adminFromReq(req), req);
    return res.json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function finalizeEventBudget(req, res) {
  try {
    const { finalizeEventBudget: finalize } = await import("../services/adminEventBudgetService.js");
    const budget = await finalize(req.params.id, adminFromReq(req), req);
    return res.json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function archiveEventBudget(req, res) {
  try {
    const { archiveEventBudget: archive } = await import("../services/adminEventBudgetService.js");
    const budget = await archive(req.params.id, adminFromReq(req), req);
    return res.json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function importBudgetExpenses(req, res) {
  try {
    const { importExpensesFromModules } = await import("../services/adminEventBudgetService.js");
    const budget = await importExpensesFromModules(req.params.id, adminFromReq(req), req);
    return res.json({ budget });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function exportBudgetPdf(req, res) {
  try {
    const { exportBudgetPdf: exp } = await import("../services/adminEventBudgetService.js");
    const { pdf, filename } = await exp(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function exportBudgetExcel(req, res) {
  try {
    const { exportBudgetExcel: exp } = await import("../services/adminEventBudgetService.js");
    const { buffer, filename } = await exp(req.params.id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function exportBudgets(req, res) {
  try {
    const { exportBudgets: exp } = await import("../services/adminEventBudgetService.js");
    const { content, filename } = await exp(req.query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(content);
  } catch (e) {
    return handleError(res, e);
  }
}

// Transactions
export async function transactionDashboard(req, res) {
  try {
    const { getTransactionDashboardStats } = await import("../services/adminFinanceTransactionService.js");
    const stats = await getTransactionDashboardStats();
    return res.json({ stats });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listTransactions(req, res) {
  try {
    const { listTransactions: list } = await import("../services/adminFinanceTransactionService.js");
    const transactions = await list(req.query);
    return res.json({ transactions });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getTransaction(req, res) {
  try {
    const { getTransactionById } = await import("../services/adminFinanceTransactionService.js");
    const transaction = await getTransactionById(req.params.id);
    return res.json({ transaction });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createTransaction(req, res) {
  try {
    const { createTransaction: create } = await import("../services/adminFinanceTransactionService.js");
    const transaction = await create(req.body, adminFromReq(req), req);
    return res.status(201).json({ transaction });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateTransaction(req, res) {
  try {
    const { updateTransaction: update } = await import("../services/adminFinanceTransactionService.js");
    const transaction = await update(req.params.id, req.body, adminFromReq(req), req);
    return res.json({ transaction });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { deleteTransaction: del } = await import("../services/adminFinanceTransactionService.js");
    await del(req.params.id, adminFromReq(req), req);
    return res.json({ success: true });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function exportTransactions(req, res) {
  try {
    const { exportTransactions: exp } = await import("../services/adminFinanceTransactionService.js");
    const { content, filename } = await exp(req.query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(content);
  } catch (e) {
    return handleError(res, e);
  }
}

// Audit Reports
export async function listAuditReports(req, res) {
  try {
    const { listAuditReports: list } = await import("../services/adminAuditReportService.js");
    const reports = await list(req.query);
    return res.json({ reports });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getAuditReport(req, res) {
  try {
    const { getAuditReportById } = await import("../services/adminAuditReportService.js");
    const report = await getAuditReportById(req.params.id);
    return res.json({ report });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function generateAuditReport(req, res) {
  try {
    const { generateAuditReport: generate } = await import("../services/adminAuditReportService.js");
    const report = await generate(req.body, adminFromReq(req), req);
    return res.status(201).json({ report });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function downloadAuditReportPdf(req, res) {
  try {
    const { downloadAuditReportPdf: download } = await import("../services/adminAuditReportService.js");
    const { pdf, filename } = await download(req.params.id, adminFromReq(req), req);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function downloadAuditReportExcel(req, res) {
  try {
    const { downloadAuditReportExcel: download } = await import("../services/adminAuditReportService.js");
    const { buffer, filename } = await download(req.params.id, adminFromReq(req), req);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (e) {
    return handleError(res, e);
  }
}

// Audit Logs
export async function listFinanceAuditLogs(req, res) {
  try {
    const { listFinanceAuditLogs: list } = await import("../services/financeAuditService.js");
    const logs = await list(req.query);
    return res.json({ logs });
  } catch (e) {
    return handleError(res, e);
  }
}

// Finance Dashboard & Settings
export async function financeDashboard(req, res) {
  try {
    const { getFinanceDashboardStats } = await import("../services/adminFinanceDashboardService.js");
    const stats = await getFinanceDashboardStats();
    return res.json({ stats });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function financialReportsSummary(req, res) {
  try {
    const { getFinancialReportsSummary } = await import("../services/adminAuditReportService.js");
    const summary = await getFinancialReportsSummary(req.query);
    return res.json({ summary });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getFinanceSettings(req, res) {
  try {
    const { getFinanceSettings: get } = await import("../services/adminInvoiceService.js");
    const settings = await get();
    return res.json({ settings });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateFinanceSettings(req, res) {
  try {
    const { updateFinanceSettings: update } = await import("../services/adminInvoiceService.js");
    const settings = await update(req.body, adminFromReq(req));
    return res.json({ settings });
  } catch (e) {
    return handleError(res, e);
  }
}
