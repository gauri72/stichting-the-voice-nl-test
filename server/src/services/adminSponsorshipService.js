import Sponsorship from "../models/Sponsorship.js";
import ReminderLog from "../models/ReminderLog.js";
import ReceiptLog from "../models/ReceiptLog.js";
import { getNextSequence } from "../utils/sequence.js";
import { logAdminAction, getAuditLogsForTarget } from "./adminAuditService.js";
import {
  renderSponsorshipReceiptPdf,
  renderSponsorshipInvoicePdf,
} from "./receiptPdf.js";
import { sendModuleEmail } from "./sponsorshipDonationMailer.js";
import env from "../config/env.js";
import { resolveDonationPublicContactEmail } from "../config/donationPublicContact.js";

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function formatMoney(minor, currency = "EUR") {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(Number(minor || 0) / 100);
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function nextId(prefix) {
  const seq = await getNextSequence(prefix);
  const year = new Date().getFullYear();
  return `${prefix.toUpperCase()}-${year}-${String(seq).padStart(6, "0")}`;
}

function formatSponsorship(doc) {
  if (!doc) return null;
  const id = doc._id.toString();
  return {
    id,
    sponsorshipId: doc.sponsorshipId,
    sponsorType: doc.sponsorType,
    sponsorName: doc.sponsorName,
    companyName: doc.companyName,
    contactPerson: doc.contactPerson,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    vatNumber: doc.vatNumber,
    website: doc.website,
    logoUrl: doc.logoUrl,
    packageName: doc.packageName,
    packageBenefits: doc.packageBenefits,
    amount: doc.amount,
    amountFormatted: formatMoney(doc.amount, doc.currency),
    currency: doc.currency,
    eventId: doc.eventId?.toString() || null,
    campaignName: doc.campaignName,
    startDate: doc.startDate,
    endDate: doc.endDate,
    sponsorshipStatus: doc.sponsorshipStatus,
    paymentStatus: doc.paymentStatus,
    paymentReference: doc.paymentReference,
    paymentMethod: doc.paymentMethod,
    paymentDate: doc.paymentDate,
    dueDate: doc.dueDate,
    invoiceNumber: doc.invoiceNumber,
    invoicePdfUrl: doc.invoicePdfUrl,
    receiptNumber: doc.receiptNumber,
    receiptPdfUrl: doc.receiptPdfUrl,
    receiptStatus: doc.receiptStatus,
    receiptSentAt: doc.receiptSentAt,
    receiptResentCount: doc.receiptResentCount,
    receiptDownloadedAt: doc.receiptDownloadedAt,
    lastReminderSentAt: doc.lastReminderSentAt,
    followUpStatus: doc.followUpStatus,
    notes: doc.notes,
    internalNotes: doc.internalNotes || [],
    addToMailingList: doc.addToMailingList,
    createdBy: doc.createdBy?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildSponsorshipFilter(params) {
  const filter = {};
  if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;
  if (params.sponsorshipStatus) filter.sponsorshipStatus = params.sponsorshipStatus;
  if (params.receiptStatus) filter.receiptStatus = params.receiptStatus;
  if (params.followUpStatus) filter.followUpStatus = params.followUpStatus;
  if (params.campaignName) filter.campaignName = params.campaignName;
  if (params.packageName) filter.packageName = new RegExp(params.packageName, "i");
  if (params.dateFrom || params.dateTo) {
    filter.createdAt = {};
    if (params.dateFrom) filter.createdAt.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (params.search) {
    const q = params.search.trim();
    filter.$or = [
      { sponsorName: new RegExp(q, "i") },
      { contactPerson: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { companyName: new RegExp(q, "i") },
      { invoiceNumber: new RegExp(q, "i") },
      { receiptNumber: new RegExp(q, "i") },
    ];
  }
  if (params.exportType === "paid") filter.paymentStatus = "paid";
  if (params.exportType === "pending") filter.paymentStatus = { $in: ["unpaid", "pending", "partially_paid"] };
  if (params.exportType === "overdue") filter.sponsorshipStatus = "overdue";
  return filter;
}

export async function getSponsorshipDashboardStats() {
  const [totalSponsors, active, pendingPayments, revenueAgg, receiptsSent, followUpsDue] =
    await Promise.all([
      Sponsorship.distinct("email").then((arr) => arr.length),
      Sponsorship.countDocuments({
        sponsorshipStatus: { $in: ["confirmed", "paid", "completed"] },
      }),
      Sponsorship.countDocuments({
        paymentStatus: { $in: ["unpaid", "pending", "partially_paid"] },
      }),
      Sponsorship.aggregate([
        { $match: { paymentStatus: { $in: ["paid", "partially_paid"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Sponsorship.countDocuments({ receiptStatus: { $in: ["sent", "resent", "downloaded"] } }),
      Sponsorship.countDocuments({
        followUpStatus: { $in: ["reminder_due", "waiting_response"] },
      }),
    ]);

  return {
    totalSponsors,
    activeSponsorships: active,
    pendingPayments,
    sponsorshipRevenue: formatMoney(revenueAgg[0]?.total || 0),
    sponsorshipRevenueMinor: revenueAgg[0]?.total || 0,
    receiptsSent,
    followUpsDue,
  };
}

export async function listSponsorships(params = {}) {
  const filter = buildSponsorshipFilter(params);
  const docs = await Sponsorship.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return docs.map(formatSponsorship);
}

export async function getSponsorshipById(id) {
  const doc = await Sponsorship.findById(id).lean();
  if (!doc) throwError("Sponsorship not found.", 404);
  const [reminderLogs, receiptLogs, auditLogs] = await Promise.all([
    ReminderLog.find({ moduleType: "sponsorship", recordId: id }).sort({ sentAt: -1 }).limit(50).lean(),
    ReceiptLog.find({ moduleType: "sponsorship", recordId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    getAuditLogsForTarget(id, 50),
  ]);
  return {
    sponsorship: formatSponsorship(doc),
    reminderHistory: reminderLogs,
    receiptHistory: receiptLogs,
    auditLogs,
    activityTimeline: buildActivityTimeline(doc, reminderLogs, receiptLogs, auditLogs),
  };
}

function buildActivityTimeline(record, reminders, receipts, audits) {
  const events = [];
  if (record.createdAt) {
    events.push({ type: "created", label: "Sponsorship Created", at: record.createdAt });
  }
  if (record.invoiceNumber) {
    events.push({ type: "invoice", label: "Invoice Generated", at: record.updatedAt, detail: record.invoiceNumber });
  }
  reminders.forEach((r) => {
    events.push({ type: "reminder", label: `Reminder Sent (${r.templateType})`, at: r.sentAt });
  });
  if (record.paymentDate) {
    events.push({ type: "payment", label: "Payment Received", at: record.paymentDate });
  }
  receipts.forEach((r) => {
    if (r.sentAt) events.push({ type: "receipt_sent", label: "Receipt Sent", at: r.sentAt });
    if (r.resentAt) events.push({ type: "receipt_resent", label: "Receipt Resent", at: r.resentAt });
  });
  if (record.receiptDownloadedAt) {
    events.push({ type: "receipt_downloaded", label: "Receipt Downloaded", at: record.receiptDownloadedAt });
  }
  audits.forEach((a) => {
    events.push({ type: "audit", label: a.summary || a.action, at: a.createdAt });
  });
  (record.internalNotes || []).forEach((n) => {
    events.push({ type: "note", label: "Note Added", at: n.createdAt, detail: n.text });
  });
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

export async function createSponsorship(body, adminId) {
  const amount = Math.round(Number(body.amount) * 100) || Math.round(Number(body.amountMinor) || 0);
  if (amount <= 0) throwError("Amount must be greater than zero.");

  const sponsorshipId = await nextId("SPN");
  let invoiceNumber = "";
  if (body.generateInvoice) {
    invoiceNumber = await nextId("INV");
  }

  const doc = await Sponsorship.create({
    sponsorshipId,
    sponsorType: body.sponsorType || "company",
    sponsorName: body.sponsorName?.trim(),
    companyName: body.companyName || "",
    contactPerson: body.contactPerson || "",
    email: body.email?.trim().toLowerCase(),
    phone: body.phone || "",
    address: body.address || "",
    vatNumber: body.vatNumber || "",
    website: body.website || "",
    logoUrl: body.logoUrl || "",
    packageName: body.packageName || body.customPackageName || "",
    packageBenefits: body.packageBenefits || "",
    amount,
    currency: body.currency || "EUR",
    eventId: body.eventId || null,
    campaignName: body.campaignName || "",
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    sponsorshipStatus: body.sponsorshipStatus || "pending",
    paymentStatus: body.paymentStatus || "unpaid",
    paymentMethod: body.paymentMethod || "",
    dueDate: body.dueDate || null,
    invoiceNumber,
    followUpStatus: body.paymentStatus === "paid" ? "no_follow_up" : "reminder_due",
    notes: body.notes || "",
    addToMailingList: Boolean(body.addToMailingList),
    createdBy: adminId || null,
  });

  await logAdminAction({
    adminId,
    action: "sponsorship_created",
    targetType: "sponsorship",
    targetId: doc._id.toString(),
    summary: "Sponsorship Created",
    detail: { sponsorshipId, sponsorName: doc.sponsorName },
  });

  if (body.sendInvoiceEmail && invoiceNumber) {
    await sendSponsorshipReminder(doc._id.toString(), adminId, {
      templateType: "invoice",
      customNote: body.notes,
    }).catch(() => {});
  }
  if (body.sendConfirmationEmail) {
    await sendSponsorshipReminder(doc._id.toString(), adminId, {
      templateType: "confirmation",
    }).catch(() => {});
  }

  return formatSponsorship(doc.toObject());
}

export async function updateSponsorship(id, body, adminId) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);

  const fields = [
    "sponsorType", "sponsorName", "companyName", "contactPerson", "email", "phone",
    "address", "vatNumber", "website", "logoUrl", "packageName", "packageBenefits",
    "currency", "eventId", "campaignName", "startDate", "endDate",
    "sponsorshipStatus", "paymentStatus", "paymentReference", "paymentMethod",
    "paymentDate", "dueDate", "followUpStatus", "notes", "addToMailingList",
  ];
  for (const key of fields) {
    if (body[key] !== undefined) doc[key] = body[key];
  }
  if (body.amount !== undefined) {
    doc.amount = Math.round(Number(body.amount) * 100) || Math.round(Number(body.amount));
  }
  if (body.internalNote) {
    doc.internalNotes.push({ text: body.internalNote, createdBy: adminId });
  }
  await doc.save();

  await logAdminAction({
    adminId,
    action: "sponsorship_updated",
    targetType: "sponsorship",
    targetId: id,
    summary: "Sponsorship Updated",
  });

  return formatSponsorship(doc.toObject());
}

export async function deleteSponsorship(id, adminId) {
  const doc = await Sponsorship.findByIdAndDelete(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  await logAdminAction({
    adminId,
    action: "sponsorship_deleted",
    targetType: "sponsorship",
    targetId: id,
    summary: "Sponsorship Deleted",
  });
  return { ok: true };
}

async function ensureReceiptNumber(doc) {
  if (doc.receiptNumber) return doc.receiptNumber;
  const receiptNumber = await nextId("RCP");
  const existing = await Sponsorship.findOne({ receiptNumber });
  if (existing) throwError("Could not generate unique receipt number.", 500);
  doc.receiptNumber = receiptNumber;
  await doc.save();
  return receiptNumber;
}

async function ensureInvoiceNumber(doc) {
  if (doc.invoiceNumber) return doc.invoiceNumber;
  const invoiceNumber = await nextId("INV");
  doc.invoiceNumber = invoiceNumber;
  await doc.save();
  return invoiceNumber;
}

export async function buildSponsorshipReceiptPdfBuffer(doc) {
  const receiptNumber = await ensureReceiptNumber(doc);
  return renderSponsorshipReceiptPdf({
    receiptNumber,
    stripePaymentId: doc.paymentReference || doc.sponsorshipId,
    paymentDate: formatDate(doc.paymentDate || doc.updatedAt),
    sponsorName: doc.sponsorName,
    sponsorEmail: doc.email,
    companyName: doc.companyName || doc.sponsorName,
    tierId: doc.packageName?.toLowerCase(),
    sponsorshipTier: doc.packageName,
    sponsorshipAmount: formatMoney(doc.amount, doc.currency),
    paymentMethod: doc.paymentMethod || "Bank transfer / Card",
    uploadUrl: env.org.sponsorUploadUrl,
    contactEmail: resolveDonationPublicContactEmail(),
    orgTagline: "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.",
  });
}

export async function buildSponsorshipInvoicePdfBuffer(doc) {
  const invoiceNumber = await ensureInvoiceNumber(doc);
  return renderSponsorshipInvoicePdf({
    invoiceNumber,
    receiptNumber: doc.receiptNumber,
    paymentDate: formatDate(doc.dueDate || new Date()),
    sponsorName: doc.sponsorName,
    sponsorEmail: doc.email,
    companyName: doc.companyName || doc.sponsorName,
    sponsorshipTier: doc.packageName,
    sponsorshipAmount: formatMoney(doc.amount, doc.currency),
    paymentMethod: doc.paymentMethod || "Bank transfer / Card",
    campaignName: doc.campaignName,
    vatNumber: doc.vatNumber,
    contactEmail: resolveDonationPublicContactEmail(),
  });
}

const REMINDER_TEMPLATE_MAP = {
  payment_reminder: "sponsorship_payment_reminder",
  overdue_reminder: "sponsorship_overdue_reminder",
  confirmation: "sponsorship_confirmation",
  thank_you: "sponsorship_thank_you",
  receipt: "sponsorship_receipt",
  invoice: "sponsorship_invoice",
};

export async function sendSponsorshipReminder(id, adminId, { templateType = "payment_reminder", customNote = "" } = {}) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  if (!doc.email) throwError("Sponsor email is required.", 400);

  const templateKey = REMINDER_TEMPLATE_MAP[templateType] || "sponsorship_payment_reminder";
  const attachments = [];
  if (templateType === "receipt" || templateType === "thank_you") {
    const pdf = await buildSponsorshipReceiptPdfBuffer(doc);
    attachments.push({
      filename: `sponsorship-receipt-${doc.receiptNumber || doc.sponsorshipId}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    });
  }
  if (templateType === "invoice") {
    const pdf = await buildSponsorshipInvoicePdfBuffer(doc);
    attachments.push({
      filename: `sponsorship-invoice-${doc.invoiceNumber}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    });
  }

  let emailResult;
  try {
    emailResult = await sendModuleEmail({
      templateKey,
      to: doc.email,
      payload: {
        fullName: doc.contactPerson || doc.sponsorName,
        sponsorName: doc.sponsorName,
        amountFormatted: formatMoney(doc.amount, doc.currency),
        currency: doc.currency,
        paymentStatus: doc.paymentStatus,
        receiptNumber: doc.receiptNumber,
        invoiceNumber: doc.invoiceNumber,
        paymentDueDate: formatDate(doc.dueDate),
        campaignName: doc.campaignName,
        packageName: doc.packageName,
        customNote,
      },
      attachments,
    });
  } catch (err) {
    await ReminderLog.create({
      reminderId: await nextId("RMD"),
      moduleType: "sponsorship",
      recordId: id,
      recipientEmail: doc.email,
      templateType,
      subject: "",
      customNote,
      sentBy: adminId,
      status: "failed",
      errorMessage: err.message,
    });
    throw err;
  }

  doc.lastReminderSentAt = new Date();
  if (templateType === "payment_reminder" || templateType === "overdue_reminder") {
    doc.followUpStatus = "reminder_sent";
  }
  if (templateType === "receipt") {
    doc.receiptStatus = doc.receiptSentAt ? "resent" : "sent";
    doc.receiptSentAt = doc.receiptSentAt || new Date();
    if (doc.receiptSentAt && templateType === "receipt") {
      doc.receiptResentCount = (doc.receiptResentCount || 0) + 1;
    }
  }
  await doc.save();

  await ReminderLog.create({
    reminderId: await nextId("RMD"),
    moduleType: "sponsorship",
    recordId: id,
    recipientEmail: doc.email,
    templateType,
    subject: emailResult.subject,
    customNote,
    sentBy: adminId,
    status: "sent",
  });

  await logAdminAction({
    adminId,
    action: templateType === "receipt" ? "sponsorship_receipt_resent" : "sponsorship_reminder_sent",
    targetType: "sponsorship",
    targetId: id,
    summary: templateType === "receipt" ? "Sponsorship Receipt Resent" : "Sponsorship Reminder Sent",
    detail: { templateType },
  });

  return formatSponsorship(doc.toObject());
}

export async function resendSponsorshipReceipt(id, adminId) {
  return sendSponsorshipReminder(id, adminId, { templateType: "receipt" });
}

export async function downloadSponsorshipReceipt(id) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  const pdf = await buildSponsorshipReceiptPdfBuffer(doc);
  doc.receiptDownloadedAt = new Date();
  doc.receiptStatus = "downloaded";
  await doc.save();
  await ReceiptLog.findOneAndUpdate(
    { moduleType: "sponsorship", recordId: id, receiptNumber: doc.receiptNumber },
    {
      $set: { downloadedAt: new Date(), status: "downloaded" },
      $setOnInsert: {
        receiptLogId: await nextId("RLG"),
        moduleType: "sponsorship",
        recordId: id,
        receiptNumber: doc.receiptNumber,
        recipientEmail: doc.email,
      },
    },
    { upsert: true }
  );
  return { pdf, receiptNumber: doc.receiptNumber, filename: `sponsorship-receipt-${doc.receiptNumber}.pdf` };
}

export async function downloadSponsorshipInvoice(id) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  const pdf = await buildSponsorshipInvoicePdfBuffer(doc);
  return { pdf, invoiceNumber: doc.invoiceNumber, filename: `sponsorship-invoice-${doc.invoiceNumber}.pdf` };
}

export async function markSponsorshipPaid(id, adminId, body = {}) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  doc.paymentStatus = "paid";
  doc.sponsorshipStatus = body.sponsorshipStatus || "paid";
  doc.paymentDate = body.paymentDate || new Date();
  doc.paymentReference = body.paymentReference || doc.paymentReference;
  doc.paymentMethod = body.paymentMethod || doc.paymentMethod;
  doc.followUpStatus = "completed";
  await doc.save();

  if (body.createReceipt !== false) {
    await ensureReceiptNumber(doc);
    await ReceiptLog.create({
      receiptLogId: await nextId("RLG"),
      moduleType: "sponsorship",
      recordId: id,
      receiptNumber: doc.receiptNumber,
      recipientEmail: doc.email,
      status: "generated",
    });
  }

  await logAdminAction({
    adminId,
    action: "sponsorship_marked_paid",
    targetType: "sponsorship",
    targetId: id,
    summary: "Sponsorship Marked Paid",
  });

  if (body.sendReceiptEmail) {
    await resendSponsorshipReceipt(id, adminId).catch(() => {});
  }

  return formatSponsorship(doc.toObject());
}

export async function markSponsorshipOverdue(id, adminId) {
  const doc = await Sponsorship.findById(id);
  if (!doc) throwError("Sponsorship not found.", 404);
  doc.sponsorshipStatus = "overdue";
  doc.followUpStatus = "reminder_due";
  await doc.save();
  await logAdminAction({
    adminId,
    action: "sponsorship_updated",
    targetType: "sponsorship",
    targetId: id,
    summary: "Sponsorship Marked Overdue",
  });
  return formatSponsorship(doc.toObject());
}

export function sponsorshipsToCsv(rows) {
  const headers = [
    "Sponsorship ID", "Sponsor Name", "Contact", "Email", "Company", "Package",
    "Amount (EUR)", "Payment Status", "Sponsorship Status", "Receipt Status",
    "Campaign", "Created", "Payment Date",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.sponsorshipId,
        r.sponsorName,
        r.contactPerson,
        r.email,
        r.companyName,
        r.packageName,
        (r.amount / 100).toFixed(2),
        r.paymentStatus,
        r.sponsorshipStatus,
        r.receiptStatus,
        r.campaignName,
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.paymentDate ? new Date(r.paymentDate).toISOString() : "",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
  }
  return lines.join("\n");
}

export async function exportSponsorships(params) {
  return sponsorshipsToCsv(await listSponsorships(params));
}
