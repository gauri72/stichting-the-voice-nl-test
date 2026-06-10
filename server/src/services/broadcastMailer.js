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

export async function sendBroadcastEmail({ to, subject, html }) {
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

  const attachments = loadEmailSocialIconAttachments();
  const finalHtml = injectSocialFooter(html);

  await transporter.sendMail({
    from: env.email.membershipFrom || env.email.from,
    replyTo: getMailReplyTo(),
    to,
    subject,
    html: finalHtml,
    attachments,
  });
}
