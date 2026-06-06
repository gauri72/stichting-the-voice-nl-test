import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import {
  buildEmailFollowUsRowHtml,
  getEmailSocialIconCids,
  loadEmailSocialIconAttachments
} from "./emailSocialIcons.js";
import { generateMembershipQrPngBuffer } from "./membershipQrService.js";
import { renderMembershipReceiptPdf } from "./membershipReceiptPdf.js";
import { getMailReplyTo, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";

export { isMailerConfigured };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_LOGO_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "client",
  "src",
  "assets",
  "header-logo.png"
);

/** @returns {import("nodemailer").Attachment | null} */
function loadHeaderLogoAttachment() {
  try {
    if (!fs.existsSync(HEADER_LOGO_PATH)) return null;
    return {
      filename: "header-logo.png",
      content: fs.readFileSync(HEADER_LOGO_PATH),
      cid: "voiceHeaderLogo"
    };
  } catch {
    console.warn("[membershipMailer] Could not load header-logo.png; email will omit logo.");
    return null;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseMailOptions() {
  return {
    from: env.email.membershipFrom || env.email.from,
    replyTo: getMailReplyTo()
  };
}

function benefitRowsHtml(values) {
  return [values.benefit_1, values.benefit_2, values.benefit_3, values.benefit_4]
    .filter((b) => b && String(b).trim())
    .map(
      (b) =>
        `<tr><td style="padding:9px 0;font-size:15px;color:#344054;">
          <span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:#16a34a;color:#fff;font-size:11px;font-weight:700;margin-right:10px;">&#10003;</span>${escapeHtml(b)}
        </td></tr>`
    )
    .join("");
}

/**
 * Builds the membership confirmation email to match the membership design:
 * dark header, membership ID card with QR, benefits, payment summary, CTA, footer.
 * @param {Record<string, string>} values
 * @param {{ logoCid?: string|null, socialIconCids?: Record<string,string> }} branding
 */
function buildMembershipEmail(values, branding = {}) {
  const logoCid = branding.logoCid || null;
  const qrCid = branding.qrCid || null;
  const followUsRowHtml = buildEmailFollowUsRowHtml(branding.socialIconCids || {});
  const subject = "Your V.O.I.C.E. NL Membership Confirmation";

  const logoImg = logoCid
    ? `<img src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="78" height="78" style="display:block;margin:0 auto;width:78px;height:auto;border:0;border-radius:14px;background:#0a8a98;" />`
    : `<span style="display:inline-block;width:78px;height:78px;border-radius:14px;background:#0a8a98;color:#fff;font-family:Georgia,serif;font-size:30px;font-weight:700;text-align:center;line-height:78px;">V</span>`;

  const footerLogoImg = logoCid
    ? `<img src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="46" height="46" style="display:block;width:46px;height:auto;border:0;border-radius:8px;background:#0a8a98;" />`
    : `<span style="display:inline-block;width:46px;height:46px;border-radius:8px;background:#0a8a98;color:#fff;font-family:Georgia,serif;font-size:18px;font-weight:700;text-align:center;line-height:46px;">V</span>`;

  const qrSrc = qrCid ? `cid:${qrCid}` : values.qr_code_url ? escapeHtml(values.qr_code_url) : "";
  const qrCell = qrSrc
    ? `<img src="${qrSrc}" width="132" height="132" alt="Membership QR Code" style="display:block;margin:0 auto 8px;width:132px;height:132px;border:8px solid #ffffff;border-radius:14px;box-shadow:0 8px 22px rgba(16,24,40,.12);" />`
    : `<div style="width:132px;height:132px;margin:0 auto 8px;border:1px dashed #c8cdd6;border-radius:14px;color:#98a2b3;font-size:12px;line-height:132px;text-align:center;">Membership QR Code</div>`;

  const text = `Dear ${values.member_name},

Thank you for becoming a ${values.membership_type} member of Stichting The V.O.I.C.E. NL. Your membership has been successfully activated.

Membership ID: ${values.membership_id}
Valid From: ${values.valid_from}
Valid Until: ${values.valid_until}
Payment Status: ${values.payment_status}

Receipt No.: ${values.receipt_number}
Amount Paid: EUR ${values.amount_paid}
Payment Reference: ${values.payment_reference}

View your membership: ${values.member_portal_url}

Stichting The V.O.I.C.E. NL`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f6f1e8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px rgba(6,21,47,.12);">

        <tr><td style="background:#0b2447;padding:34px 30px;text-align:center;">
          ${logoImg}
          <p style="margin:16px 0 6px;font-size:11px;letter-spacing:2px;font-weight:800;color:#3ec6d4;">MEMBERSHIP CONFIRMATION</p>
          <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;font-family:Georgia,'Times New Roman',serif;">Welcome to the V.O.I.C.E. NL Family</h1>
          <p style="margin:12px auto 0;max-width:420px;font-size:14px;line-height:1.6;color:#c7d3e6;">Your membership is confirmed. Thank you for supporting culture, community, creativity and impact.</p>
        </td></tr>

        <tr><td style="padding:28px 30px 6px;">
          <p style="font-size:16px;line-height:1.7;margin:0 0 14px;color:#06152f;">Dear <strong>${escapeHtml(values.member_name)}</strong>,</p>
          <p style="font-size:15px;line-height:1.7;color:#344054;margin:0;">Thank you for becoming a <strong>${escapeHtml(values.membership_type)}</strong> member of Stichting The V.O.I.C.E. NL. Your membership has been successfully activated and your unique membership ID has been created.</p>
        </td></tr>

        <tr><td style="padding:18px 30px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;border-radius:14px;">
            <tr>
              <td style="padding:22px 20px;vertical-align:top;width:58%;">
                <p style="margin:0;font-size:11px;letter-spacing:1px;font-weight:800;color:#d1007f;">MEMBERSHIP ID</p>
                <div style="font-size:26px;line-height:1.2;color:#06152f;font-weight:900;margin:8px 0 16px;">${escapeHtml(values.membership_id)}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#344054;">
                  <tr><td style="padding:6px 0;font-weight:700;">Membership</td><td style="padding:6px 0;text-align:right;">${escapeHtml(values.membership_type)}</td></tr>
                  <tr><td style="padding:6px 0;font-weight:700;">Valid From</td><td style="padding:6px 0;text-align:right;">${escapeHtml(values.valid_from)}</td></tr>
                  <tr><td style="padding:6px 0;font-weight:700;">Valid Until</td><td style="padding:6px 0;text-align:right;">${escapeHtml(values.valid_until)}</td></tr>
                  <tr><td style="padding:6px 0;font-weight:700;">Payment Status</td><td style="padding:6px 0;text-align:right;">${escapeHtml(values.payment_status)}</td></tr>
                </table>
              </td>
              <td style="padding:22px 20px;vertical-align:middle;width:42%;text-align:center;">
                ${qrCell}
                <p style="margin:0;font-size:11px;color:#98a2b3;">Scan at events for membership verification</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 30px 4px;">
          <h2 style="margin:0 0 6px;font-size:20px;color:#06152f;font-family:Georgia,'Times New Roman',serif;">Your Membership Benefits</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${benefitRowsHtml(values)}</table>
        </td></tr>

        <tr><td style="padding:14px 30px 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e2d6;border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:1px;font-weight:800;color:#7a8aa0;">PAYMENT SUMMARY</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#344054;">
                <tr><td style="padding:7px 0;">Receipt No.</td><td style="padding:7px 0;text-align:right;font-weight:700;">${escapeHtml(values.receipt_number)}</td></tr>
                <tr><td style="padding:7px 0;">Amount Paid</td><td style="padding:7px 0;text-align:right;font-weight:900;color:#06152f;">&euro;${escapeHtml(values.amount_paid)}</td></tr>
                <tr><td style="padding:7px 0;">Payment Method</td><td style="padding:7px 0;text-align:right;">${escapeHtml(values.payment_method)}</td></tr>
                <tr><td style="padding:7px 0;">Payment Reference</td><td style="padding:7px 0;text-align:right;">${escapeHtml(values.payment_reference)}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 30px 26px;text-align:center;">
          <a href="${escapeHtml(values.member_portal_url)}" style="display:inline-block;background:linear-gradient(135deg,#00a6b7,#d1007f,#f7941d);color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;padding:14px 32px;border-radius:999px;">View My Membership</a>
        </td></tr>

        <tr><td style="border-top:1px solid #eef0f3;padding:22px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;padding-right:12px;">${footerLogoImg}</td>
            <td style="vertical-align:top;font-size:11px;line-height:1.6;color:#5a6d82;">
              <strong style="color:#06152f;font-size:13px;">Stichting The V.O.I.C.E. NL</strong><br/>
              ${escapeHtml(env.org.tagline)}<br/>
              Email: ${escapeHtml(env.org.contactEmail)} &nbsp;|&nbsp; Website: stichtingthevoice.nl<br/>
              KVK: 92180213 &nbsp;|&nbsp; Office: +31 6 19032104
              ${followUsRowHtml}
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#f6f1e8;padding:14px 30px;text-align:center;font-size:11px;color:#98a2b3;">© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

/**
 * @param {{ emailPayload: Record<string, string>, memberEmail: string }} payload
 */
export async function sendMembershipEmails(payload) {
  const tx = getSmtpTransporter();
  const from = env.email.membershipFrom || env.email.from;
  if (!tx || !from) {
    console.warn("[membershipMailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = payload.emailPayload || {};
  const memberEmail = payload.memberEmail || values.member_email;
  if (!memberEmail) {
    console.warn("[membershipMailer] Email not sent: member email missing.");
    return { skipped: true };
  }

  const logoAtt = loadHeaderLogoAttachment();
  const socialIconAtts = loadEmailSocialIconAttachments();
  const socialIconCids = getEmailSocialIconCids();

  // Attach the QR as an inline CID image so it always renders in email clients
  // (data: URIs are blocked, and the hosted URL may point at a server without the
  // QR route yet). The QR still encodes the public verification link.
  let qrAtt = null;
  if (values.verification_token) {
    try {
      qrAtt = {
        filename: "membership-qr.png",
        content: await generateMembershipQrPngBuffer(values.verification_token),
        cid: "membershipQr",
        contentDisposition: "inline"
      };
    } catch (error) {
      console.warn("[membershipMailer] Could not generate QR for email:", error.message);
    }
  }

  const mail = buildMembershipEmail(values, {
    logoCid: logoAtt?.cid || null,
    qrCid: qrAtt?.cid || null,
    socialIconCids
  });

  let pdfBuffer = null;
  try {
    pdfBuffer = await renderMembershipReceiptPdf(values);
  } catch (error) {
    console.error("[membershipMailer] Failed to render membership receipt PDF:", error.message);
  }

  const attachments = [
    ...(logoAtt ? [logoAtt] : []),
    ...(qrAtt ? [qrAtt] : []),
    ...socialIconAtts,
    ...(pdfBuffer
      ? [
          {
            filename: `Membership-Receipt-${values.receipt_number || "VOICE"}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      : [])
  ];

  const tasks = [
    tx.sendMail({
      ...baseMailOptions(),
      to: memberEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments
    })
  ];

  if (env.email.orgNotify) {
    tasks.push(
      tx.sendMail({
        ...baseMailOptions(),
        to: env.email.orgNotify,
        subject: `New membership: ${values.membership_type} — ${values.member_name}`,
        text: `A new membership was purchased.

Member: ${values.member_name}
Email: ${values.member_email}
Membership ID: ${values.membership_id}
Plan: ${values.membership_type}
Amount: €${values.amount_paid}
Receipt: ${values.receipt_number}
Payment reference: ${values.payment_reference}`
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}
