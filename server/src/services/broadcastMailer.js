import env from "../config/env.js";
import {
  buildEmailFollowUsRowHtml,
  getEmailSocialIconCids,
  loadEmailSocialIconAttachments,
} from "./emailSocialIcons.js";
import { getMailReplyTo, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";

function injectSocialFooter(html) {
  if (html.includes("voice-social-row")) return html;
  const socialIconCids = getEmailSocialIconCids();
  const followUsRowHtml = buildEmailFollowUsRowHtml(socialIconCids);
  if (!followUsRowHtml) return html;

  const marker = "</body>";
  const footerBlock = `<div class="voice-social-row" style="display:none;">${followUsRowHtml}</div>`;
  if (html.toLowerCase().includes(marker.toLowerCase())) {
    return html.replace(/<\/body>/i, `${footerBlock}</body>`);
  }
  return `${html}${footerBlock}`;
}

// Keeps the actual sending mailbox (SPF/DKIM-authorized) but swaps the display name —
// same pattern as ticketMailer.js's buildFromHeader, for a partner-branded broadcast
// (e.g. "Amsterdam Flames") without needing a second real mailbox.
function buildBroadcastFromHeader(fromName) {
  const configured = env.email.membershipFrom || env.email.from;
  if (!fromName) return configured;
  const match = /^(.*)<(.+)>$/.exec(configured || "");
  const address = match ? match[2].trim() : configured;
  return address ? `${fromName} <${address}>` : configured;
}

export async function sendBroadcastEmail({ to, subject, html, attachments: extraAttachments = [], fromName }) {
  if (!isMailerConfigured()) {
    const error = new Error("Email is not configured on the server.");
    error.status = 503;
    throw error;
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    const error = new Error("Email transport is unavailable.");
    error.status = 503;
    throw error;
  }

  const attachments = [...loadEmailSocialIconAttachments(), ...extraAttachments];
  const finalHtml = injectSocialFooter(html);

  await transporter.sendMail({
    from: buildBroadcastFromHeader(fromName),
    replyTo: getMailReplyTo(),
    to,
    subject,
    html: finalHtml,
    attachments,
  });
}
