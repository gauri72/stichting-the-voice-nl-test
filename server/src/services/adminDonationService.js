import Donation from "../models/Donation.js";
import ReminderLog from "../models/ReminderLog.js";
import ReceiptLog from "../models/ReceiptLog.js";
import { getNextSequence } from "../utils/sequence.js";
import { logAdminAction, getAuditLogsForTarget } from "./adminAuditService.js";
import { renderDonationReceiptPdf } from "./receiptPdf.js";
import { sendModuleEmail } from "./sponsorshipDonationMailer.js";
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

function formatDonation(doc) {
  if (!doc) return null;
  const id = doc._id.toString();
  const displayName = doc.isAnonymous ? "Anonymous Donor" : doc.donorName;
  return {
    id,
    donationId: doc.donationId,
    donorType: doc.donorType,
    donorName: displayName,
    rawDonorName: doc.donorName,
    email: doc.isAnonymous ? "" : doc.email,
    phone: doc.phone,
    address: doc.address,
    country: doc.country,
    isAnonymous: doc.isAnonymous,
    newsletterOptIn: doc.newsletterOptIn,
    donationType: doc.donationType,
    amount: doc.amount,
    amountFormatted: formatMoney(doc.amount, doc.currency),
    currency: doc.currency,
    campaignName: doc.campaignName,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    paymentReference: doc.paymentReference,
    paymentDate: doc.paymentDate,
    donationDate: doc.donationDate,
    recurringStatus: doc.recurringStatus,
    recurringFrequency: doc.recurringFrequency,
    receiptNumber: doc.receiptNumber,
    receiptPdfUrl: doc.receiptPdfUrl,
    receiptStatus: doc.receiptStatus,
    receiptSentAt: doc.receiptSentAt,
    receiptResentCount: doc.receiptResentCount,
    receiptDownloadedAt: doc.receiptDownloadedAt,
    lastReminderSentAt: doc.lastReminderSentAt,
    notes: doc.notes,
    internalNotes: doc.internalNotes || [],
    addToMailingList: doc.addToMailingList,
    createdBy: doc.createdBy?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildDonationFilter(params) {
  const filter = {};
  if (params.donationType) filter.donationType = params.donationType;
  if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;
  if (params.receiptStatus) filter.receiptStatus = params.receiptStatus;
  if (params.recurringStatus) filter.recurringStatus = params.recurringStatus;
  if (params.campaignName) filter.campaignName = params.campaignName;
  if (params.amountMin) filter.amount = { ...filter.amount, $gte: Number(params.amountMin) };
  if (params.amountMax) filter.amount = { ...filter.amount, $lte: Number(params.amountMax) };
  if (params.dateFrom || params.dateTo) {
    filter.donationDate = {};
    if (params.dateFrom) filter.donationDate.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.donationDate.$lte = end;
    }
  }
  if (params.search) {
    const q = params.search.trim();
    filter.$or = [
      { donorName: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { receiptNumber: new RegExp(q, "i") },
      { paymentReference: new RegExp(q, "i") },
      { campaignName: new RegExp(q, "i") },
    ];
  }
  if (params.exportType === "paid") filter.paymentStatus = "paid";
  if (params.exportType === "recurring") filter.recurringStatus = "active";
  return filter;
}

export async function getDonationDashboardStats() {
  const [totalDonations, totalDonors, revenueAgg, recurring, pendingReceipts, remindersDue] =
    await Promise.all([
      Donation.countDocuments({}),
      Donation.distinct("email", { isAnonymous: false }).then((arr) => arr.filter(Boolean).length),
      Donation.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Donation.countDocuments({ recurringStatus: "active" }),
      Donation.countDocuments({
        paymentStatus: "paid",
        receiptStatus: { $in: ["not_sent"] },
      }),
      Donation.countDocuments({
        paymentStatus: { $in: ["pending", "failed"] },
        recurringStatus: { $in: ["active", "failed_payment"] },
      }),
    ]);

  return {
    totalDonations,
    totalDonors,
    donationRevenue: formatMoney(revenueAgg[0]?.total || 0),
    donationRevenueMinor: revenueAgg[0]?.total || 0,
    recurringDonations: recurring,
    pendingReceipts,
    remindersDue,
  };
}

export async function listDonations(params = {}) {
  const filter = buildDonationFilter(params);
  const docs = await Donation.find(filter).sort({ donationDate: -1 }).limit(500).lean();
  return docs.map(formatDonation);
}

async function getGivingHistory(email) {
  if (!email) return null;
  const donations = await Donation.find({ email: email.toLowerCase(), paymentStatus: "paid" }).lean();
  const total = donations.reduce((s, d) => s + d.amount, 0);
  const campaigns = [...new Set(donations.map((d) => d.campaignName).filter(Boolean))];
  const lastDate = donations.length
    ? donations.reduce((max, d) => (d.donationDate > max ? d.donationDate : max), donations[0].donationDate)
    : null;
  return {
    totalDonated: total,
    totalDonatedFormatted: formatMoney(total),
    numberOfDonations: donations.length,
    averageDonation: donations.length ? Math.round(total / donations.length) : 0,
    averageDonationFormatted: formatMoney(donations.length ? Math.round(total / donations.length) : 0),
    lastDonationDate: lastDate,
    campaignsSupported: campaigns,
  };
}

function buildActivityTimeline(record, reminders, receipts, audits) {
  const events = [];
  if (record.createdAt) events.push({ type: "created", label: "Donation Created", at: record.createdAt });
  if (record.paymentDate) events.push({ type: "payment", label: "Payment Received", at: record.paymentDate });
  reminders.forEach((r) => {
    events.push({ type: "reminder", label: `Reminder Sent (${r.templateType})`, at: r.sentAt });
  });
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

export async function getDonationById(id) {
  const doc = await Donation.findById(id).lean();
  if (!doc) throwError("Donation not found.", 404);
  const [reminderLogs, receiptLogs, auditLogs, givingHistory] = await Promise.all([
    ReminderLog.find({ moduleType: "donation", recordId: id }).sort({ sentAt: -1 }).limit(50).lean(),
    ReceiptLog.find({ moduleType: "donation", recordId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    getAuditLogsForTarget(id, 50),
    getGivingHistory(doc.isAnonymous ? null : doc.email),
  ]);
  return {
    donation: formatDonation(doc),
    givingHistory,
    reminderHistory: reminderLogs,
    receiptHistory: receiptLogs,
    auditLogs,
    activityTimeline: buildActivityTimeline(doc, reminderLogs, receiptLogs, auditLogs),
  };
}

export async function createDonation(body, adminId) {
  const amount = Math.round(Number(body.amount) * 100) || Math.round(Number(body.amountMinor) || 0);
  if (amount <= 0) throwError("Amount must be greater than zero.");

  const donationId = await nextId("DON");
  const isAnonymous = Boolean(body.isAnonymous || body.markAsAnonymous);

  const doc = await Donation.create({
    donationId,
    donorType: isAnonymous ? "anonymous" : body.donorType || "individual",
    donorName: body.donorName?.trim() || (isAnonymous ? "Anonymous" : ""),
    email: isAnonymous ? "" : body.email?.trim().toLowerCase(),
    phone: body.phone || "",
    address: body.address || "",
    country: body.country || "",
    isAnonymous,
    newsletterOptIn: Boolean(body.newsletterOptIn),
    donationType: body.donationType || "one_time",
    amount,
    currency: body.currency || "EUR",
    campaignName: body.campaignName || "",
    paymentMethod: body.paymentMethod || "",
    paymentStatus: body.paymentStatus || "pending",
    paymentReference: body.paymentReference || "",
    paymentDate: body.paymentDate || null,
    donationDate: body.donationDate || new Date(),
    recurringStatus: body.recurringStatus || (body.donationType === "recurring" ? "active" : "not_recurring"),
    recurringFrequency: body.recurringFrequency || "",
    notes: body.notes || "",
    addToMailingList: Boolean(body.addToMailingList),
    createdBy: adminId || null,
  });

  await logAdminAction({
    adminId,
    action: "donation_created",
    targetType: "donation",
    targetId: doc._id.toString(),
    summary: "Donation Created",
    detail: { donationId, amount },
  });

  if (body.generateReceipt && doc.paymentStatus === "paid") {
    await ensureReceiptNumber(doc);
  }
  if (body.sendReceiptEmail && doc.email) {
    await resendDonationReceipt(doc._id.toString(), adminId).catch(() => {});
  }
  if (body.sendThankYouEmail && doc.email) {
    await sendDonationReminder(doc._id.toString(), adminId, { templateType: "thank_you" }).catch(() => {});
  }

  return formatDonation(doc.toObject());
}

export async function updateDonation(id, body, adminId) {
  const doc = await Donation.findById(id);
  if (!doc) throwError("Donation not found.", 404);

  const fields = [
    "donorType", "donorName", "email", "phone", "address", "country",
    "isAnonymous", "newsletterOptIn", "donationType", "currency", "campaignName",
    "paymentMethod", "paymentStatus", "paymentReference", "paymentDate",
    "donationDate", "recurringStatus", "recurringFrequency", "notes", "addToMailingList",
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
    action: "donation_updated",
    targetType: "donation",
    targetId: id,
    summary: "Donation Updated",
  });

  return formatDonation(doc.toObject());
}

export async function deleteDonation(id, adminId) {
  const doc = await Donation.findByIdAndDelete(id);
  if (!doc) throwError("Donation not found.", 404);
  await logAdminAction({
    adminId,
    action: "donation_deleted",
    targetType: "donation",
    targetId: id,
    summary: "Donation Deleted",
  });
  return { ok: true };
}

async function ensureReceiptNumber(doc) {
  if (doc.receiptNumber) return doc.receiptNumber;
  const receiptNumber = await nextId("RCP");
  const existing = await Donation.findOne({ receiptNumber });
  if (existing) throwError("Could not generate unique receipt number.", 500);
  doc.receiptNumber = receiptNumber;
  await doc.save();
  return receiptNumber;
}

export async function buildDonationReceiptPdfBuffer(doc) {
  const receiptNumber = await ensureReceiptNumber(doc);
  return renderDonationReceiptPdf({
    receiptNumber,
    stripePaymentId: doc.paymentReference || doc.donationId,
    paymentDate: formatDate(doc.paymentDate || doc.donationDate),
    donorName: doc.isAnonymous ? "Anonymous Donor" : doc.donorName,
    donorEmail: doc.email,
    donationLevel: doc.campaignName || doc.donationType,
    donationAmount: formatMoney(doc.amount, doc.currency),
    paymentMethod: doc.paymentMethod || "Card via Stripe",
    donorAddress: doc.address,
    websiteUrl: process.env.PUBLIC_SITE_URL || "https://stichtingthevoice.nl",
    contactEmail: resolveDonationPublicContactEmail(),
    orgTagline: "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.",
  });
}

const REMINDER_TEMPLATE_MAP = {
  receipt: "donation_receipt",
  thank_you: "donation_thank_you",
  reminder: "donation_reminder",
  recurring_reminder: "recurring_donation_reminder",
  failed_payment: "failed_payment_reminder",
  campaign_followup: "campaign_followup",
};

export async function sendDonationReminder(id, adminId, { templateType = "reminder", customNote = "" } = {}) {
  const doc = await Donation.findById(id);
  if (!doc) throwError("Donation not found.", 404);
  if (!doc.email) throwError("Donor email is required.", 400);

  const templateKey = REMINDER_TEMPLATE_MAP[templateType] || "donation_reminder";
  const attachments = [];
  if (templateType === "receipt" || templateType === "thank_you") {
    const pdf = await buildDonationReceiptPdfBuffer(doc);
    attachments.push({
      filename: `donation-receipt-${doc.receiptNumber || doc.donationId}.pdf`,
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
        fullName: doc.donorName,
        donorName: doc.isAnonymous ? "Valued Supporter" : doc.donorName,
        amountFormatted: formatMoney(doc.amount, doc.currency),
        currency: doc.currency,
        paymentStatus: doc.paymentStatus,
        receiptNumber: doc.receiptNumber,
        campaignName: doc.campaignName,
        customNote,
      },
      attachments,
    });
  } catch (err) {
    await ReminderLog.create({
      reminderId: await nextId("RMD"),
      moduleType: "donation",
      recordId: id,
      recipientEmail: doc.email,
      templateType,
      customNote,
      sentBy: adminId,
      status: "failed",
      errorMessage: err.message,
    });
    throw err;
  }

  doc.lastReminderSentAt = new Date();
  if (templateType === "receipt") {
    const isResend = Boolean(doc.receiptSentAt);
    doc.receiptStatus = isResend ? "resent" : "sent";
    doc.receiptSentAt = doc.receiptSentAt || new Date();
    if (isResend) doc.receiptResentCount = (doc.receiptResentCount || 0) + 1;

    await ReceiptLog.findOneAndUpdate(
      { moduleType: "donation", recordId: id, receiptNumber: doc.receiptNumber },
      {
        $set: {
          sentAt: doc.receiptSentAt,
          ...(isResend ? { resentAt: new Date(), status: "resent" } : { status: "sent" }),
          recipientEmail: doc.email,
        },
        $inc: isResend ? { resentCount: 1 } : {},
        $setOnInsert: {
          receiptLogId: await nextId("RLG"),
          moduleType: "donation",
          recordId: id,
          receiptNumber: doc.receiptNumber,
        },
      },
      { upsert: true }
    );
  }
  await doc.save();

  await ReminderLog.create({
    reminderId: await nextId("RMD"),
    moduleType: "donation",
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
    action: templateType === "receipt" ? "donation_receipt_resent" : "donation_reminder_sent",
    targetType: "donation",
    targetId: id,
    summary: templateType === "receipt" ? "Donation Receipt Resent" : "Donation Reminder Sent",
    detail: { templateType },
  });

  return formatDonation(doc.toObject());
}

export async function resendDonationReceipt(id, adminId) {
  return sendDonationReminder(id, adminId, { templateType: "receipt" });
}

export async function downloadDonationReceipt(id) {
  const doc = await Donation.findById(id);
  if (!doc) throwError("Donation not found.", 404);
  const pdf = await buildDonationReceiptPdfBuffer(doc);
  doc.receiptDownloadedAt = new Date();
  doc.receiptStatus = "downloaded";
  await doc.save();
  return { pdf, receiptNumber: doc.receiptNumber, filename: `donation-receipt-${doc.receiptNumber}.pdf` };
}

export async function markDonationPaid(id, adminId, body = {}) {
  const doc = await Donation.findById(id);
  if (!doc) throwError("Donation not found.", 404);
  doc.paymentStatus = "paid";
  doc.paymentDate = body.paymentDate || new Date();
  doc.paymentReference = body.paymentReference || doc.paymentReference;
  doc.paymentMethod = body.paymentMethod || doc.paymentMethod;
  await doc.save();
  await ensureReceiptNumber(doc);

  await logAdminAction({
    adminId,
    action: "donation_marked_paid",
    targetType: "donation",
    targetId: id,
    summary: "Donation Marked Paid",
  });

  if (body.sendReceiptEmail && doc.email) {
    await resendDonationReceipt(id, adminId).catch(() => {});
  }

  return formatDonation(doc.toObject());
}

export async function markDonationRefunded(id, adminId) {
  const doc = await Donation.findById(id);
  if (!doc) throwError("Donation not found.", 404);
  doc.paymentStatus = "refunded";
  if (doc.recurringStatus === "active") doc.recurringStatus = "cancelled";
  await doc.save();

  await logAdminAction({
    adminId,
    action: "donation_refunded",
    targetType: "donation",
    targetId: id,
    summary: "Donation Refunded",
  });

  return formatDonation(doc.toObject());
}

export function donationsToCsv(rows) {
  const headers = [
    "Donation ID", "Donor Name", "Email", "Type", "Amount (EUR)",
    "Payment Status", "Receipt Status", "Recurring", "Campaign", "Donation Date", "Payment Date",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.donationId,
        r.donorName,
        r.email,
        r.donationType,
        (r.amount / 100).toFixed(2),
        r.paymentStatus,
        r.receiptStatus,
        r.recurringStatus,
        r.campaignName,
        r.donationDate ? new Date(r.donationDate).toISOString() : "",
        r.paymentDate ? new Date(r.paymentDate).toISOString() : "",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
  }
  return lines.join("\n");
}

export async function exportDonations(params) {
  return donationsToCsv(await listDonations(params));
}
