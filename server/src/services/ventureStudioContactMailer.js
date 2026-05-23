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

export async function sendVentureStudioMessageEmail({ name, email, subject, message }) {
  const tx = getSmtpTransporter();
  const notifyTo = getNotifyInbox();

  if (!tx || !env.email.from || !notifyTo) {
    console.warn("[ventureStudioContact] Message email not sent: SMTP or notify inbox not configured.");
    return { sent: false };
  }

  const safeName = String(name || "").trim();
  const safeEmail = String(email || "").trim();
  const safeSubject = String(subject || "").trim();
  const safeMessage = String(message || "").trim();

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:640px;">
      <h1 style="color:#0e2f48;font-size:20px;margin:0 0 16px;">Venture Studio — new message</h1>
      <p style="margin:0 0 16px;color:#3d5a66;">A visitor submitted the <strong>Send Us a Message</strong> form on the VOICE Venture Studio page.</p>
      ${buildTableHtml([
        fieldRow("Name", safeName),
        fieldRow("Email", safeEmail),
        fieldRow("Subject", safeSubject),
        fieldRow("Message", safeMessage, { multiline: true })
      ])}
    </div>
  `;

  const text = [
    "Venture Studio — new message",
    "",
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Subject: ${safeSubject}`,
    "",
    "Message:",
    safeMessage
  ].join("\n");

  await tx.sendMail({
    ...baseMailOptions(safeEmail),
    to: notifyTo,
    subject: `[Venture Studio] ${safeSubject}`,
    text,
    html
  });

  return { sent: true };
}

export async function sendVentureStudioQuoteEmail({
  service,
  projectType,
  timeline,
  details
}) {
  const tx = getSmtpTransporter();
  const notifyTo = getNotifyInbox();

  if (!tx || !env.email.from || !notifyTo) {
    console.warn("[ventureStudioContact] Quote email not sent: SMTP or notify inbox not configured.");
    return { sent: false };
  }

  const safeService = String(service || "").trim();
  const safeProjectType = String(projectType || "").trim();
  const safeTimeline = String(timeline || "").trim();
  const safeDetails = String(details || "").trim();

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:640px;">
      <h1 style="color:#0e2f48;font-size:20px;margin:0 0 16px;">Venture Studio — service quote request</h1>
      <p style="margin:0 0 16px;color:#3d5a66;">A visitor submitted the <strong>Request Our Services</strong> form on the VOICE Venture Studio page.</p>
      ${buildTableHtml([
        fieldRow("Service needed", safeService),
        fieldRow("Project type / industry", safeProjectType || "—"),
        fieldRow("Timeline", safeTimeline || "—"),
        fieldRow("Project details", safeDetails, { multiline: true })
      ])}
    </div>
  `;

  const text = [
    "Venture Studio — service quote request",
    "",
    `Service needed: ${safeService}`,
    `Project type / industry: ${safeProjectType || "—"}`,
    `Timeline: ${safeTimeline || "—"}`,
    "",
    "Project details:",
    safeDetails
  ].join("\n");

  await tx.sendMail({
    ...baseMailOptions(),
    to: notifyTo,
    subject: `[Venture Studio] Quote request — ${safeService}`,
    text,
    html
  });

  return { sent: true };
}

export { isMailerConfigured };
