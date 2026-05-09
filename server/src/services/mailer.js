import nodemailer from "nodemailer";
import env from "../config/env.js";
import { renderSponsorshipReceiptPdf } from "./receiptPdf.js";

let transporter = null;

function buildTransporter() {
  if (!env.email.host || !env.email.user || !env.email.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = buildTransporter();
  return transporter;
}

export function isMailerConfigured() {
  return Boolean(env.email.host && env.email.user && env.email.pass && env.email.from);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAmount(amountMinor, currency) {
  const value = Number(amountMinor || 0) / 100;
  const code = (currency || env.stripe.currency || "eur").toUpperCase();
  const isWhole = Math.abs(value - Math.round(value)) < 0.005;
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: code,
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (_error) {
    return `${code} ${value.toFixed(isWhole ? 0 : 2)}`;
  }
}

function formatPaymentDate(unixSeconds) {
  const ms = unixSeconds ? Number(unixSeconds) * 1000 : Date.now();
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch (_error) {
    return date.toISOString().slice(0, 10);
  }
}

function buildPlaceholders(payload) {
  const sponsor = payload.sponsor || {};
  const sponsorshipAmount = formatAmount(payload.amountMinor, payload.currency);
  return {
    sponsor_name: sponsor.name || sponsor.firstName || "Sponsor",
    company_name: sponsor.organization || "",
    sponsor_email: sponsor.email || "",
    sponsorship_tier: payload.tier?.name || "Sponsorship",
    sponsorship_amount: sponsorshipAmount,
    payment_date: payload.paymentDate || formatPaymentDate(payload.paymentCreated),
    stripe_payment_id: payload.paymentIntentId || "",
    receipt_number: payload.receiptNumber || "",
    payment_method: payload.paymentMethod || "Card via Stripe",
    contact_email: env.org.contactEmail,
    upload_url: env.org.sponsorUploadUrl
  };
}

function buildSponsorEmail(values) {
  const subject = "Thank You for Sponsoring Stichting The V.O.I.C.E. NL";

  const text = `Dear ${values.sponsor_name},

On behalf of Stichting The V.O.I.C.E. NL, we warmly thank you for your generous sponsorship and for becoming part of our cultural journey.

Your support helps us promote international cultural exchange, artistic collaboration, community engagement, and meaningful events that bring people together through film, music, dance, and creative expression.

We are pleased to confirm that we have received your sponsorship payment.

Sponsorship Tier: ${values.sponsorship_tier}
Sponsorship Amount: ${values.sponsorship_amount}
Payment Date: ${values.payment_date}
Payment Reference: ${values.stripe_payment_id}
Receipt Number: ${values.receipt_number}

Your official sponsorship receipt is attached to this email for your records.

To begin preparing your sponsor visibility and promotional materials, please upload your high-definition logo files, media files, promotional materials, brand guidelines and approved sponsor text using the secure pCloud upload request below:
${values.upload_url}

We are truly grateful for your trust and support. We look forward to showcasing your brand as a valued partner of Stichting The V.O.I.C.E. NL and creating meaningful cultural impact together.

Warm regards,
Stichting The V.O.I.C.E. NL
${values.contact_email}
`;

  const safe = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, escapeHtml(v)])
  );

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f8fb;font-family:Arial,Helvetica,sans-serif;color:#17314b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(10,47,69,0.08);">
      <tr>
        <td style="background:linear-gradient(90deg,#1b7d8f 0%,#1f9f78 100%);color:#ffffff;padding:28px 30px 22px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.9;">Stichting The V.O.I.C.E. NL</p>
          <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;">Thank You for Your Sponsorship</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 30px 8px;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">Dear <strong>${safe.sponsor_name}</strong>,</p>
          <p style="margin:0 0 14px;">
            On behalf of Stichting The V.O.I.C.E. NL, we warmly thank you for your generous sponsorship and for becoming part of our cultural journey.
          </p>
          <p style="margin:0 0 14px;">
            Your support helps us promote international cultural exchange, artistic collaboration, community engagement, and meaningful events that bring people together through film, music, dance, and creative expression.
          </p>
          <p style="margin:0 0 6px;">
            We are pleased to confirm that we have received your sponsorship payment.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8ef;border-radius:10px;margin:16px 0 18px;font-size:14px;">
            <tr>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;width:46%;color:#5d6e7f;">Sponsorship Tier</td>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;color:#17314b;"><strong>${safe.sponsorship_tier}</strong></td>
            </tr>
            <tr>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;color:#5d6e7f;">Sponsorship Amount</td>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;color:#1f9f78;"><strong>${safe.sponsorship_amount}</strong></td>
            </tr>
            <tr>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;color:#5d6e7f;">Payment Date</td>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;">${safe.payment_date}</td>
            </tr>
            <tr>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;color:#5d6e7f;">Payment Reference</td>
              <td style="padding:11px 14px;border-bottom:1px solid #eef1f5;font-family:Consolas,Menlo,monospace;font-size:13px;">${safe.stripe_payment_id}</td>
            </tr>
            <tr>
              <td style="padding:11px 14px;color:#5d6e7f;">Receipt Number</td>
              <td style="padding:11px 14px;font-family:Consolas,Menlo,monospace;font-size:13px;">${safe.receipt_number}</td>
            </tr>
          </table>
          <p style="margin:0 0 14px;">
            Your official sponsorship receipt is attached to this email for your records.
          </p>
          <p style="margin:0 0 6px;">
            To begin preparing your sponsor visibility and promotional materials, please upload your high-definition logo files, media files, promotional materials, brand guidelines and approved sponsor text using the secure pCloud upload request below:
          </p>
          <p style="margin:6px 0 18px;">
            <a href="${safe.upload_url}" style="color:#1b7d8f;font-weight:bold;word-break:break-all;">${safe.upload_url}</a>
          </p>
          <p style="margin:0 0 14px;">
            We are truly grateful for your trust and support. We look forward to showcasing your brand as a valued partner of Stichting The V.O.I.C.E. NL and creating meaningful cultural impact together.
          </p>
          <p style="margin:18px 0 0;">
            Warm regards,<br/>
            <strong style="color:#17314b;">Stichting The V.O.I.C.E. NL</strong><br/>
            <a href="mailto:${safe.contact_email}" style="color:#1b7d8f;">${safe.contact_email}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 30px 26px;color:#7c8a99;font-size:12px;line-height:1.5;border-top:1px solid #eef1f5;">
          &copy; ${new Date().getFullYear()} Stichting The V.O.I.C.E. NL.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

function buildOrgNotificationEmail(payload, values) {
  const sponsor = payload.sponsor || {};
  const tierName = payload.tier?.name || "Sponsorship";
  const subject = `New sponsorship: ${tierName} - ${values.sponsorship_amount}`;

  const text = `New sponsorship received

Tier: ${tierName}
Amount: ${values.sponsorship_amount}
Receipt Number: ${values.receipt_number}
Stripe Payment Intent: ${values.stripe_payment_id}
Payment Date: ${values.payment_date}
Payment Method: ${values.payment_method}

Sponsor:
- Name: ${sponsor.name || `${sponsor.firstName || ""} ${sponsor.lastName || ""}`.trim()}
- Email: ${sponsor.email || "-"}
- Phone: ${sponsor.phone || "-"}
- Organization: ${sponsor.organization || "-"}
- Country: ${sponsor.country || "-"}
- Message: ${sponsor.message || "-"}
`;

  return { subject, text, html: `<pre style="font-family:monospace;">${escapeHtml(text)}</pre>` };
}

export async function sendSponsorshipEmails(payload) {
  const tx = getTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = buildPlaceholders(payload);
  const sponsorMail = buildSponsorEmail(values);
  const orgMail = buildOrgNotificationEmail(payload, values);

  let pdfBuffer = null;
  try {
    pdfBuffer = await renderSponsorshipReceiptPdf({
      receiptNumber: values.receipt_number,
      stripePaymentId: values.stripe_payment_id,
      paymentDate: values.payment_date,
      sponsorName: values.sponsor_name,
      sponsorEmail: values.sponsor_email,
      companyName: values.company_name,
      sponsorshipTier: values.sponsorship_tier,
      sponsorshipAmount: values.sponsorship_amount,
      paymentMethod: values.payment_method,
      paymentStatus: "Paid",
      uploadUrl: values.upload_url,
      contactEmail: values.contact_email,
      orgTagline: env.org.tagline
    });
  } catch (error) {
    console.error("[mailer] Failed to render PDF receipt:", error.message);
  }

  const sponsorAttachments = pdfBuffer
    ? [
        {
          filename: `Sponsorship-Receipt-${values.receipt_number || "VOICE"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    : [];

  const tasks = [];

  if (payload.sponsor?.email) {
    tasks.push(
      tx.sendMail({
        from: env.email.from,
        to: payload.sponsor.email,
        subject: sponsorMail.subject,
        text: sponsorMail.text,
        html: sponsorMail.html,
        attachments: sponsorAttachments
      })
    );
  }

  if (env.email.orgNotify) {
    tasks.push(
      tx.sendMail({
        from: env.email.from,
        to: env.email.orgNotify,
        subject: orgMail.subject,
        text: orgMail.text,
        html: orgMail.html,
        attachments: sponsorAttachments
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}
