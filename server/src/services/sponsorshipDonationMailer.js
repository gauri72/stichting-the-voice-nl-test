import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isMailerConfigured, getSmtpTransporter, getMailFromAddress } from "./smtpTransport.js";
import { resolveDonationPublicContactEmail } from "../config/donationPublicContact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "..", "templates", "email");
const ORG_NAME = "Stichting The V.O.I.C.E. NL";
const WEBSITE_URL = process.env.PUBLIC_SITE_URL || "https://stichtingthevoice.nl";

const TEMPLATE_FILES = {
  sponsorship_confirmation: "sponsorship-confirmation.html",
  sponsorship_invoice: "sponsorship-invoice.html",
  sponsorship_payment_reminder: "sponsorship-payment-reminder.html",
  sponsorship_overdue_reminder: "sponsorship-overdue-reminder.html",
  sponsorship_receipt: "sponsorship-receipt.html",
  sponsorship_thank_you: "sponsorship-thank-you.html",
  donation_receipt: "donation-receipt.html",
  donation_thank_you: "donation-thank-you.html",
  donation_reminder: "donation-reminder.html",
  recurring_donation_reminder: "recurring-donation-reminder.html",
  failed_payment_reminder: "failed-payment-reminder.html",
  campaign_followup: "campaign-followup.html",
};

const SUBJECTS = {
  sponsorship_confirmation: "Sponsorship Confirmation — {{organization_name}}",
  sponsorship_invoice: "Sponsorship Invoice {{invoice_number}} — {{organization_name}}",
  sponsorship_payment_reminder: "Payment Reminder — Your Sponsorship — {{organization_name}}",
  sponsorship_overdue_reminder: "Overdue Payment — Sponsorship — {{organization_name}}",
  sponsorship_receipt: "Sponsorship Receipt {{receipt_number}} — {{organization_name}}",
  sponsorship_thank_you: "Thank You for Your Sponsorship — {{organization_name}}",
  donation_receipt: "Donation Receipt {{receipt_number}} — {{organization_name}}",
  donation_thank_you: "Thank You for Your Donation — {{organization_name}}",
  donation_reminder: "Donation Reminder — {{organization_name}}",
  recurring_donation_reminder: "Recurring Donation Reminder — {{organization_name}}",
  failed_payment_reminder: "Failed Payment — Recurring Donation — {{organization_name}}",
  campaign_followup: "Campaign Update — {{campaign_name}} — {{organization_name}}",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTemplate(html, vars) {
  let out = html;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), escapeHtml(val));
  }
  return out;
}

function loadTemplate(templateKey) {
  const file = TEMPLATE_FILES[templateKey];
  if (!file) return null;
  const filePath = path.join(TEMPLATE_DIR, file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function buildVars(payload) {
  const firstName = (payload.fullName || payload.firstName || payload.sponsorName || payload.donorName || "")
    .split(" ")[0];
  return {
    first_name: firstName || "there",
    full_name: payload.fullName || payload.sponsorName || payload.donorName || "",
    organization_name: ORG_NAME,
    amount: payload.amountFormatted || "",
    currency: payload.currency || "EUR",
    payment_status: payload.paymentStatus || "",
    receipt_number: payload.receiptNumber || "",
    invoice_number: payload.invoiceNumber || "",
    payment_due_date: payload.paymentDueDate || "",
    campaign_name: payload.campaignName || "",
    event_name: payload.eventName || payload.campaignName || "",
    receipt_download_url: payload.receiptDownloadUrl || "",
    invoice_download_url: payload.invoiceDownloadUrl || "",
    website_url: WEBSITE_URL,
    support_email: resolveDonationPublicContactEmail(payload.supportEmail),
    custom_note: payload.customNote || "",
    package_name: payload.packageName || "",
  };
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!isMailerConfigured()) {
    console.warn("[sponsorship-donation-mailer] SMTP not configured, skipping email to", to);
    return false;
  }
  const transport = getSmtpTransporter();
  await transport.sendMail({
    from: getMailFromAddress() || `"${ORG_NAME}" <noreply@stichtingthevoice.nl>`,
    to,
    subject,
    html,
    attachments: attachments || [],
  });
  return true;
}

export async function sendModuleEmail({ templateKey, to, payload, attachments }) {
  if (!to || !String(to).includes("@")) {
    throw Object.assign(new Error("Valid recipient email is required."), { status: 400 });
  }
  const htmlTemplate = loadTemplate(templateKey);
  const vars = buildVars(payload);
  const subjectTemplate = SUBJECTS[templateKey] || `${ORG_NAME} Notification`;
  const subject = renderTemplate(subjectTemplate, vars).replace(/&quot;/g, '"');
  const html = htmlTemplate
    ? renderTemplate(htmlTemplate, vars)
    : `<p>Hi ${escapeHtml(vars.first_name)},</p><p>This is a message from ${ORG_NAME}.</p>`;
  await sendEmail({ to, subject, html, attachments });
  return { subject, sent: true };
}

export { buildVars, loadTemplate, ORG_NAME, WEBSITE_URL };
