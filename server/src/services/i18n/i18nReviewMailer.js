import env from "../../config/env.js";
import { getSmtpTransporter, getMailFromAddress } from "../smtpTransport.js";

function getAdminNotificationEmail() {
  return env.email.orgNotify || "info@stichtingthevoice.nl";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function notifyAdminOfNewTranslations(items) {
  const transport = getSmtpTransporter();
  const adminTo = getAdminNotificationEmail();
  if (!transport) {
    console.warn("[i18n-review] SMTP not configured — skipping translation review notification.");
    return { sent: false, reason: "smtp_not_configured" };
  }

  const rows = items
    .map(
      (item) => `
      <tr>
        <td><strong>${escapeHtml(item.namespace)}</strong><br/>${escapeHtml(item.key)}</td>
        <td>${escapeHtml(item.lang.toUpperCase())}</td>
        <td>${escapeHtml(item.englishText)}</td>
        <td>${escapeHtml(item.translatedText)}</td>
      </tr>`
    )
    .join("");

  const reviewUrl = `${env.clientUrl}/admin/i18n-review`;
  const html = `
    <h2>${items.length} new translation${items.length === 1 ? "" : "s"} generated</h2>
    <p>The automated i18n pipeline just filled in the translations below. They are already live — review, edit, approve, or reject them at <a href="${reviewUrl}">${reviewUrl}</a>.</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Section / key</th><th>Lang</th><th>English</th><th>Translation</th></tr>
      ${rows}
    </table>
  `;

  await transport.sendMail({
    from: getMailFromAddress(),
    to: adminTo,
    subject: `[V.O.I.C.E.] ${items.length} new translation${items.length === 1 ? "" : "s"} to review`,
    html,
    text: items.map((i) => `${i.namespace}.${i.key} [${i.lang}]: ${i.translatedText}`).join("\n"),
  });

  return { sent: true, to: adminTo };
}
