import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import SystemEmailTemplate from "../models/SystemEmailTemplate.js";
import { EMAIL_TEMPLATE_TYPES, EMAIL_TEMPLATE_VARIABLES } from "../config/settingsConfig.js";
import { generateTemplateId } from "./settingsService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "..", "templates", "email");

const FILE_MAP = {
  sponsorship_confirmation: "sponsorship-confirmation.html",
  sponsorship_invoice: "sponsorship-invoice.html",
  sponsorship_payment_reminder: "sponsorship-payment-reminder.html",
  sponsorship_receipt: "sponsorship-receipt.html",
  sponsorship_thank_you: "sponsorship-thank-you.html",
  donation_receipt: "donation-receipt.html",
  donation_thank_you: "donation-thank-you.html",
  recurring_donation_reminder: "recurring-donation-reminder.html",
  failed_donation_payment: "failed-payment-reminder.html",
  personal_discount_code: "personal-discount-code.html",
  referral_code_created: "referral-code-created.html",
  discount_expiring_soon: "discount-expiring-soon.html",
  invoice_reminder: "sponsorship-payment-reminder.html",
  invoice_overdue: "sponsorship-overdue-reminder.html",
};

const DEFAULT_NAMES = {
  sponsorship_confirmation: "Sponsorship Confirmation",
  sponsorship_invoice: "Sponsorship Invoice",
  sponsorship_payment_reminder: "Sponsorship Payment Reminder",
  sponsorship_receipt: "Sponsorship Receipt",
  sponsorship_thank_you: "Sponsorship Thank You",
  donation_receipt: "Donation Receipt",
  donation_thank_you: "Donation Thank You",
  donation_confirmation: "Donation Confirmation",
  membership_confirmation: "Membership Confirmation",
  ticket_confirmation: "Ticket Confirmation",
};

const DEFAULT_SUBJECTS = {
  sponsorship_confirmation: "Sponsorship Confirmation — {{organization_name}}",
  sponsorship_invoice: "Invoice {{invoice_number}} — {{organization_name}}",
  donation_receipt: "Donation Receipt {{receipt_number}} — {{organization_name}}",
  donation_thank_you: "Thank You for Your Donation — {{organization_name}}",
  membership_confirmation: "Welcome — Your Membership — {{organization_name}}",
  ticket_confirmation: "Your Tickets — {{event_name}}",
};

function loadFileHtml(templateType) {
  const file = FILE_MAP[templateType];
  if (!file) return null;
  const filePath = path.join(TEMPLATE_DIR, file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function defaultHtml(templateType) {
  return (
    loadFileHtml(templateType) ||
    `<p>Hello {{first_name}},</p><p>This is the ${DEFAULT_NAMES[templateType] || templateType} email from {{organization_name}}.</p>`
  );
}

export async function ensureEmailTemplatesSeeded() {
  for (const templateType of EMAIL_TEMPLATE_TYPES) {
    const exists = await SystemEmailTemplate.findOne({ templateType }).lean();
    if (exists) continue;
    const html = defaultHtml(templateType);
    await SystemEmailTemplate.create({
      templateId: generateTemplateId(),
      templateType,
      name: DEFAULT_NAMES[templateType] || templateType.replace(/_/g, " "),
      subject: DEFAULT_SUBJECTS[templateType] || "{{organization_name}} notification",
      htmlBody: html,
      defaultHtmlBody: html,
      variables: EMAIL_TEMPLATE_VARIABLES,
      status: "active",
    });
  }
}

export async function listEmailTemplates() {
  await ensureEmailTemplatesSeeded();
  return SystemEmailTemplate.find({ status: { $ne: "archived" } })
    .sort({ templateType: 1 })
    .populate("updatedBy", "name email")
    .lean();
}

export async function getEmailTemplateById(templateId) {
  const tpl = await SystemEmailTemplate.findOne({
    $or: [{ templateId }, { _id: templateId }],
  })
    .populate("updatedBy", "name email")
    .lean();
  if (!tpl) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }
  return tpl;
}

export async function getTemplateByType(templateType) {
  await ensureEmailTemplatesSeeded();
  let tpl = await SystemEmailTemplate.findOne({ templateType, status: "active" }).lean();
  if (!tpl) {
    const html = defaultHtml(templateType);
    tpl = {
      templateType,
      subject: DEFAULT_SUBJECTS[templateType] || "{{organization_name}}",
      htmlBody: html,
      plainTextBody: "",
    };
  }
  return tpl;
}

export async function updateEmailTemplate(templateId, data, adminId) {
  const tpl = await SystemEmailTemplate.findOne({
    $or: [{ templateId }, { _id: templateId }],
  });
  if (!tpl) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }

  if (data.name !== undefined) tpl.name = data.name;
  if (data.subject !== undefined) tpl.subject = data.subject;
  if (data.preheader !== undefined) tpl.preheader = data.preheader;
  if (data.htmlBody !== undefined) tpl.htmlBody = data.htmlBody;
  if (data.plainTextBody !== undefined) tpl.plainTextBody = data.plainTextBody;
  if (data.status !== undefined) tpl.status = data.status;
  if (data.variables !== undefined) tpl.variables = data.variables;
  tpl.version = (tpl.version || 1) + 1;
  tpl.updatedBy = adminId;
  await tpl.save();
  return tpl.toObject();
}

export async function restoreEmailTemplateDefault(templateId, adminId) {
  const tpl = await SystemEmailTemplate.findOne({
    $or: [{ templateId }, { _id: templateId }],
  });
  if (!tpl) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }
  const html = tpl.defaultHtmlBody || defaultHtml(tpl.templateType);
  tpl.htmlBody = html;
  tpl.version = (tpl.version || 1) + 1;
  tpl.updatedBy = adminId;
  await tpl.save();
  return tpl.toObject();
}

export function renderTemplateContent(template, vars = {}) {
  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  let html = template.htmlBody || "";
  let subject = template.subject || "";
  for (const [key, val] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    html = html.replace(re, escapeHtml(val));
    subject = subject.replace(re, String(val || ""));
  }
  return { html, subject };
}

export async function previewEmailTemplate(templateId, sampleVars = {}) {
  const tpl = await getEmailTemplateById(templateId);
  const vars = {
    first_name: "Alex",
    full_name: "Alex de Vries",
    email: "alex@example.com",
    organization_name: "Stichting The V.O.I.C.E. NL",
    website_url: "https://stichtingthevoice.nl",
    support_email: "info@stichtingthevoice.nl",
    amount: "€50.00",
    currency: "EUR",
    event_name: "Summer Festival",
    ...sampleVars,
  };
  return renderTemplateContent(tpl, vars);
}
