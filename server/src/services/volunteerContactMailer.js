import env from "../config/env.js";
import {
  getMailReplyTo,
  getSmtpTransporter,
  isMailerConfigured
} from "./smtpTransport.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getNotifyInbox() {
  return env.email.orgNotify || env.org.contactEmail;
}

function baseMailOptions(replyTo) {
  return {
    from: env.email.from,
    replyTo: replyTo || getMailReplyTo()
  };
}

function fieldRow(label, value, { multiline = false } = {}) {
  const raw = value || "—";
  const safe = multiline ? escapeHtml(raw).replace(/\n/g, "<br/>") : escapeHtml(raw);
  return `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0e2f48;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#3d5a66;">${safe}</td></tr>`;
}

function buildTableHtml(rows) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Segoe UI,Tahoma,sans-serif;font-size:14px;line-height:1.5;">${rows.join("")}</table>`;
}

export async function sendVolunteerApplicationEmail({ name, email, phone, message }) {
  const tx = getSmtpTransporter();
  const notifyTo = getNotifyInbox();

  if (!tx || !env.email.from || !notifyTo) {
    console.warn("[volunteerContact] Application email not sent: SMTP or notify inbox not configured.");
    return { sent: false };
  }

  const safeName = String(name || "").trim();
  const safeEmail = String(email || "").trim();
  const safePhone = String(phone || "").trim();
  const safeMessage = String(message || "").trim();

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:640px;">
      <h1 style="color:#0e2f48;font-size:20px;margin:0 0 16px;">New volunteer application</h1>
      <p style="margin:0 0 16px;color:#3d5a66;">Someone submitted the volunteer form on the Stichting The V.O.I.C.E. NL website.</p>
      ${buildTableHtml([
        fieldRow("Name", safeName),
        fieldRow("Email", safeEmail),
        fieldRow("Phone", safePhone || "—"),
        fieldRow("Message", safeMessage, { multiline: true })
      ])}
    </div>
  `;

  const text = [
    "New volunteer application",
    "",
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Phone: ${safePhone || "—"}`,
    "",
    "Message:",
    safeMessage
  ].join("\n");

  await tx.sendMail({
    ...baseMailOptions(safeEmail),
    to: notifyTo,
    subject: `[Volunteer] Application from ${safeName}`,
    text,
    html
  });

  return { sent: true };
}

export { isMailerConfigured };
