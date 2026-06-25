import Invoice from "../models/Invoice.js";
import Event from "../models/Event.js";
import FinanceSettings from "../models/FinanceSettings.js";
import {
  formatMoney,
  formatDate,
  formatDateShort,
  nextFinanceId,
  computeLineTotal,
  computeInvoiceTotals,
  throwFinanceError,
  csvEscape,
} from "../utils/financeUtils.js";
import { logFinanceAction } from "./financeAuditService.js";
import { renderInvoicePdf } from "./financePdfService.js";
import { buildInvoicesExcel } from "./financeExcelService.js";
import { sendModuleEmail } from "./sponsorshipDonationMailer.js";
import { escapeRegex } from "../utils/regexUtils.js";

function formatInvoice(doc) {
  if (!doc) return null;
  const id = doc._id.toString();
  return {
    id,
    invoiceId: doc.invoiceId,
    invoiceNumber: doc.invoiceNumber,
    clientType: doc.clientType,
    clientName: doc.clientName,
    companyName: doc.companyName,
    contactPerson: doc.contactPerson,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    vatNumber: doc.vatNumber,
    relatedType: doc.relatedType,
    relatedEventId: doc.relatedEventId?.toString() || null,
    relatedEventName: doc.relatedEventName,
    relatedModule: doc.relatedModule,
    relatedRecordId: doc.relatedRecordId,
    lineItems: (doc.lineItems || []).map((l) => ({
      ...l,
      unitPriceFormatted: formatMoney(l.unitPrice),
      lineTotalFormatted: formatMoney(l.lineTotal),
    })),
    subtotal: doc.subtotal,
    subtotalFormatted: formatMoney(doc.subtotal),
    vatAmount: doc.vatAmount,
    vatAmountFormatted: formatMoney(doc.vatAmount),
    discountAmount: doc.discountAmount,
    discountAmountFormatted: formatMoney(doc.discountAmount),
    totalAmount: doc.totalAmount,
    totalAmountFormatted: formatMoney(doc.totalAmount),
    amountPaid: doc.amountPaid,
    amountPaidFormatted: formatMoney(doc.amountPaid),
    balanceDue: doc.balanceDue,
    balanceDueFormatted: formatMoney(doc.balanceDue),
    currency: doc.currency,
    invoiceDate: doc.invoiceDate,
    dueDate: doc.dueDate,
    paymentStatus: doc.paymentStatus,
    sentStatus: doc.sentStatus,
    sentAt: doc.sentAt,
    resentCount: doc.resentCount,
    pdfUrl: doc.pdfUrl,
    paymentReference: doc.paymentReference,
    paymentLink: doc.paymentLink,
    attachTerms: doc.attachTerms,
    footerNote: doc.footerNote,
    notes: doc.notes,
    createdBy: doc.createdBy?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildInvoiceFilter(params) {
  const filter = {};
  if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;
  if (params.sentStatus) filter.sentStatus = params.sentStatus;
  if (params.relatedType) filter.relatedType = params.relatedType;
  if (params.clientType) filter.clientType = params.clientType;
  if (params.eventId) filter.relatedEventId = params.eventId;
  if (params.amountMin) filter.totalAmount = { ...filter.totalAmount, $gte: Number(params.amountMin) };
  if (params.amountMax) filter.totalAmount = { ...filter.totalAmount, $lte: Number(params.amountMax) };
  if (params.dateFrom || params.dateTo) {
    filter.invoiceDate = {};
    if (params.dateFrom) filter.invoiceDate.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }
  if (params.dueFrom || params.dueTo) {
    filter.dueDate = {};
    if (params.dueFrom) filter.dueDate.$gte = new Date(params.dueFrom);
    if (params.dueTo) {
      const end = new Date(params.dueTo);
      end.setHours(23, 59, 59, 999);
      filter.dueDate.$lte = end;
    }
  }
  if (params.search) {
    const q = escapeRegex(params.search.trim());
    filter.$or = [
      { invoiceNumber: new RegExp(q, "i") },
      { clientName: new RegExp(q, "i") },
      { companyName: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { relatedEventName: new RegExp(q, "i") },
      { paymentReference: new RegExp(q, "i") },
    ];
  }
  return filter;
}

async function getSettings() {
  let settings = await FinanceSettings.findOne({ key: "default" }).lean();
  if (!settings) {
    settings = await FinanceSettings.create({ key: "default" });
    settings = settings.toObject();
  }
  return settings;
}

function normalizeLineItems(items) {
  return (items || []).map((item) => {
    const lineTotal = computeLineTotal(item);
    return {
      description: item.description || "",
      quantity: Number(item.quantity) || 1,
      unitPrice: Math.round(Number(item.unitPrice) * 100) || Number(item.unitPrice) || 0,
      vatRate: Number(item.vatRate) || 21,
      discount: Math.round(Number(item.discount) * 100) || Number(item.discount) || 0,
      lineTotal,
    };
  });
}

function normalizeAmountField(val) {
  if (val === undefined || val === null || val === "") return 0;
  const n = Number(val);
  if (n < 1000 && String(val).includes(".")) return Math.round(n * 100);
  return Math.round(n);
}

async function buildPdfPayload(invoice, settings) {
  const paymentDetails = [
    settings.bankName && `Bank: ${settings.bankName}`,
    settings.iban && `IBAN: ${settings.iban}`,
    settings.bic && `BIC: ${settings.bic}`,
    invoice.paymentReference && `Reference: ${invoice.paymentReference}`,
    invoice.paymentLink && `Pay online: ${invoice.paymentLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDate(invoice.invoiceDate),
    dueDate: formatDate(invoice.dueDate),
    clientName: invoice.clientName,
    companyName: invoice.companyName,
    contactPerson: invoice.contactPerson,
    email: invoice.email,
    phone: invoice.phone,
    address: invoice.address,
    vatNumber: invoice.vatNumber,
    lineItems: invoice.lineItems.map((l) => ({
      ...l,
      unitPriceFormatted: formatMoney(l.unitPrice),
      discountFormatted: formatMoney(l.discount),
      lineTotalFormatted: formatMoney(l.lineTotal),
    })),
    subtotalFormatted: formatMoney(invoice.subtotal),
    vatAmountFormatted: formatMoney(invoice.vatAmount),
    discountAmountFormatted: formatMoney(invoice.discountAmount),
    totalAmountFormatted: formatMoney(invoice.totalAmount),
    amountPaidFormatted: formatMoney(invoice.amountPaid),
    balanceDueFormatted: formatMoney(invoice.balanceDue),
    paymentDetails,
    footerNote: invoice.footerNote || settings.invoiceFooterNote,
  };
}

export async function getInvoiceDashboardStats() {
  const [total, paid, pending, overdue, revenueAgg, outstandingAgg] = await Promise.all([
    Invoice.countDocuments({ paymentStatus: { $ne: "cancelled" } }),
    Invoice.countDocuments({ paymentStatus: "paid" }),
    Invoice.countDocuments({ paymentStatus: { $in: ["draft", "sent", "viewed", "partially_paid"] } }),
    Invoice.countDocuments({ paymentStatus: "overdue" }),
    Invoice.aggregate([
      { $match: { paymentStatus: { $in: ["paid", "partially_paid"] } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]),
    Invoice.aggregate([
      { $match: { paymentStatus: { $in: ["sent", "viewed", "partially_paid", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$balanceDue" } } },
    ]),
  ]);

  return {
    totalInvoices: total,
    paidInvoices: paid,
    pendingInvoices: pending,
    overdueInvoices: overdue,
    invoiceRevenue: formatMoney(revenueAgg[0]?.total || 0),
    invoiceRevenueMinor: revenueAgg[0]?.total || 0,
    outstandingAmount: formatMoney(outstandingAgg[0]?.total || 0),
    outstandingMinor: outstandingAgg[0]?.total || 0,
  };
}

export async function listInvoices(params = {}) {
  const filter = buildInvoiceFilter(params);
  const docs = await Invoice.find(filter).sort({ invoiceDate: -1 }).limit(500).lean();
  return docs.map(formatInvoice);
}

export async function getInvoiceById(id) {
  const doc = await Invoice.findById(id).lean();
  if (!doc) throwFinanceError("Invoice not found.", 404);
  const { getAuditLogsForEntity } = await import("./financeAuditService.js");
  const auditLogs = await getAuditLogsForEntity(doc.invoiceId || doc._id.toString());
  return { invoice: formatInvoice(doc), auditLogs };
}

export async function createInvoice(data, admin, req) {
  const settings = await getSettings();
  const lineItems = normalizeLineItems(data.lineItems);
  const discountAmount = normalizeAmountField(data.discountAmount);
  const totals = computeInvoiceTotals(lineItems, discountAmount);
  const amountPaid = normalizeAmountField(data.amountPaid);
  const invoiceId = await nextFinanceId("FINV");
  const invoiceNumber = `${settings.invoicePrefix || "INV"}-${new Date().getFullYear()}-${invoiceId.split("-").pop()}`;

  let relatedEventName = data.relatedEventName || "";
  if (data.relatedEventId) {
    const event = await Event.findById(data.relatedEventId).select("title name").lean();
    relatedEventName = event?.title || event?.name || relatedEventName;
  }

  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : new Date(Date.now() + (settings.paymentTermsDays || 30) * 86400000);

  const doc = await Invoice.create({
    invoiceId,
    invoiceNumber,
    clientType: data.clientType || "individual",
    clientName: data.clientName || "",
    companyName: data.companyName || "",
    contactPerson: data.contactPerson || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    vatNumber: data.vatNumber || "",
    relatedType: data.relatedType || "custom",
    relatedEventId: data.relatedEventId || null,
    relatedEventName,
    relatedModule: data.relatedModule || "",
    relatedRecordId: data.relatedRecordId || "",
    lineItems,
    ...totals,
    amountPaid,
    balanceDue: Math.max(0, totals.totalAmount - amountPaid),
    currency: data.currency || settings.defaultCurrency || "EUR",
    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
    dueDate,
    paymentStatus: data.saveAsDraft ? "draft" : data.paymentStatus || "draft",
    sentStatus: "not_sent",
    paymentReference: data.paymentReference || "",
    paymentLink: data.paymentLink || "",
    attachTerms: data.attachTerms !== false,
    footerNote: data.footerNote || "",
    notes: data.notes || "",
    createdBy: admin?.id || admin?._id,
  });

  await logFinanceAction({
    admin,
    action: "invoice_created",
    entityType: "invoice",
    entityId: doc.invoiceId,
    newValue: { invoiceNumber: doc.invoiceNumber },
    req,
  });

  if (data.sendByEmail && doc.email) {
    await sendInvoiceEmail(doc._id.toString(), admin, req, false);
  }

  return formatInvoice(doc.toObject());
}

export async function updateInvoice(id, data, admin, req) {
  const doc = await Invoice.findById(id);
  if (!doc) throwFinanceError("Invoice not found.", 404);
  const oldValue = formatInvoice(doc.toObject());

  if (data.lineItems) {
    const lineItems = normalizeLineItems(data.lineItems);
    const discountAmount = normalizeAmountField(data.discountAmount ?? doc.discountAmount);
    const totals = computeInvoiceTotals(lineItems, discountAmount);
    doc.lineItems = lineItems;
    Object.assign(doc, totals);
  }

  const fields = [
    "clientType", "clientName", "companyName", "contactPerson", "email", "phone", "address",
    "vatNumber", "relatedType", "relatedModule", "relatedRecordId", "paymentStatus", "sentStatus",
    "paymentReference", "paymentLink", "attachTerms", "footerNote", "notes", "currency",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) doc[f] = data[f];
  }
  if (data.relatedEventId !== undefined) {
    doc.relatedEventId = data.relatedEventId || null;
    if (data.relatedEventId) {
      const event = await Event.findById(data.relatedEventId).select("title name").lean();
      doc.relatedEventName = event?.title || event?.name || "";
    }
  }
  if (data.invoiceDate) doc.invoiceDate = new Date(data.invoiceDate);
  if (data.dueDate) doc.dueDate = new Date(data.dueDate);
  if (data.amountPaid !== undefined) {
    doc.amountPaid = normalizeAmountField(data.amountPaid);
    doc.balanceDue = Math.max(0, doc.totalAmount - doc.amountPaid);
  }

  await doc.save();
  await logFinanceAction({
    admin,
    action: "invoice_updated",
    entityType: "invoice",
    entityId: doc.invoiceId,
    oldValue,
    newValue: formatInvoice(doc.toObject()),
    req,
  });
  return formatInvoice(doc.toObject());
}

export async function duplicateInvoice(id, admin, req) {
  const original = await Invoice.findById(id).lean();
  if (!original) throwFinanceError("Invoice not found.", 404);
  const { _id, invoiceId, invoiceNumber, sentAt, resentCount, createdAt, updatedAt, ...rest } = original;
  return createInvoice(
    {
      ...rest,
      lineItems: original.lineItems,
      saveAsDraft: true,
      paymentStatus: "draft",
      amountPaid: 0,
    },
    admin,
    req
  );
}

export async function deleteInvoice(id, admin, req) {
  const doc = await Invoice.findById(id);
  if (!doc) throwFinanceError("Invoice not found.", 404);
  await logFinanceAction({
    admin,
    action: "invoice_updated",
    entityType: "invoice",
    entityId: doc.invoiceId,
    oldValue: formatInvoice(doc.toObject()),
    notes: "Invoice deleted",
    req,
  });
  await Invoice.deleteOne({ _id: id });
  return { success: true };
}

async function buildInvoicePdfBuffer(invoiceDoc) {
  const settings = await getSettings();
  const formatted = formatInvoice(invoiceDoc.toObject ? invoiceDoc.toObject() : invoiceDoc);
  const payload = await buildPdfPayload(formatted, settings);
  const pdf = await renderInvoicePdf(payload);
  return { pdf, filename: `invoice-${formatted.invoiceNumber}.pdf` };
}

export async function downloadInvoicePdf(id, admin, req) {
  const doc = await Invoice.findById(id).lean();
  if (!doc) throwFinanceError("Invoice not found.", 404);
  await logFinanceAction({
    admin,
    action: "invoice_downloaded",
    entityType: "invoice",
    entityId: doc.invoiceId,
    req,
  });
  return buildInvoicePdfBuffer(doc);
}

export async function sendInvoiceEmail(id, admin, req, isResend = false) {
  const doc = await Invoice.findById(id);
  if (!doc) throwFinanceError("Invoice not found.", 404);
  if (!doc.email) throwFinanceError("Invoice has no email address.");

  const { pdf, filename } = await buildInvoicePdfBuffer(doc);
  await sendModuleEmail({
    to: doc.email,
    templateKey: "sponsorship_invoice",
    payload: {
      invoiceNumber: doc.invoiceNumber,
      amountFormatted: formatMoney(doc.balanceDue || doc.totalAmount),
      paymentDueDate: formatDate(doc.dueDate),
      sponsorName: doc.clientName,
      companyName: doc.companyName,
      sponsorEmail: doc.email,
      customNote: `Please find attached your invoice from Stichting The V.O.I.C.E. NL.`,
    },
    attachments: [{ content: pdf, contentType: "application/pdf", filename }],
  });

  doc.sentStatus = isResend ? "resent" : "sent";
  doc.sentAt = new Date();
  if (isResend) doc.resentCount = (doc.resentCount || 0) + 1;
  if (doc.paymentStatus === "draft") doc.paymentStatus = "sent";
  await doc.save();

  await logFinanceAction({
    admin,
    action: isResend ? "invoice_resent" : "invoice_sent",
    entityType: "invoice",
    entityId: doc.invoiceId,
    req,
  });
  return formatInvoice(doc.toObject());
}

export async function markInvoicePaid(id, data, admin, req) {
  const doc = await Invoice.findById(id);
  if (!doc) throwFinanceError("Invoice not found.", 404);
  const amountPaid = data.partial
    ? normalizeAmountField(data.amountPaid ?? doc.amountPaid)
    : doc.totalAmount;
  doc.amountPaid = amountPaid;
  doc.balanceDue = Math.max(0, doc.totalAmount - amountPaid);
  doc.paymentStatus = data.partial || amountPaid < doc.totalAmount ? "partially_paid" : "paid";
  if (data.paymentReference) doc.paymentReference = data.paymentReference;
  await doc.save();
  await logFinanceAction({
    admin,
    action: "invoice_marked_paid",
    entityType: "invoice",
    entityId: doc.invoiceId,
    newValue: { paymentStatus: doc.paymentStatus, amountPaid },
    req,
  });
  return formatInvoice(doc.toObject());
}

export async function markInvoiceOverdue(id, admin, req) {
  return updateInvoice(id, { paymentStatus: "overdue" }, admin, req);
}

export async function cancelInvoice(id, admin, req) {
  return updateInvoice(id, { paymentStatus: "cancelled" }, admin, req);
}

export function invoicesToCsv(rows) {
  const headers = [
    "Invoice Number", "Client", "Email", "Related Type", "Event", "Invoice Date", "Due Date",
    "Total", "Paid", "Balance", "Payment Status", "Sent Status",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.invoiceNumber, r.clientName || r.companyName, r.email, r.relatedType, r.relatedEventName,
        formatDateShort(r.invoiceDate), formatDateShort(r.dueDate), r.totalAmountFormatted,
        r.amountPaidFormatted, r.balanceDueFormatted, r.paymentStatus, r.sentStatus,
      ].map(csvEscape).join(",")
    );
  }
  return lines.join("\n");
}

export async function exportInvoices(params, format = "csv") {
  const rows = await listInvoices(params);
  if (format === "xlsx") {
    const buffer = await buildInvoicesExcel(rows);
    return { buffer, filename: "invoices-export.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  }
  return { content: invoicesToCsv(rows), filename: "invoices-export.csv", contentType: "text/csv; charset=utf-8" };
}

export async function getFinanceSettings() {
  return getSettings();
}

export async function updateFinanceSettings(data, admin) {
  const settings = await FinanceSettings.findOneAndUpdate(
    { key: "default" },
    { ...data, updatedBy: admin?.id || admin?._id },
    { upsert: true, new: true }
  ).lean();
  return settings;
}
