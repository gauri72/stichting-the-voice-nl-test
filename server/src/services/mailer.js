import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import { SPONSORSHIP_COVERAGE } from "../config/sponsorshipCoverage.js";
import { renderSponsorshipReceiptPdf } from "./receiptPdf.js";

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
    console.warn("[mailer] Could not load header-logo.png; sponsor email will omit logo.");
    return null;
  }
}

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

function buildSponsorEmail(values, branding = {}) {
  const logoCid = branding.logoCid || null;
  const logoCell = logoCid
    ? `<img class="email-logo" src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="56" height="56" style="display:block;width:56px;height:auto;border:0;border-radius:8px;background:#ffffff;object-fit:contain;" />`
    : `<span class="email-logo" style="display:inline-block;width:56px;height:56px;border-radius:8px;background:#ffffff;text-align:center;line-height:56px;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#008080;">V</span>`;
  const footerLogoCell = logoCid
    ? `<img src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="50" height="50" style="display:block;width:50px;height:auto;border:0;border-radius:6px;background:#ffffff;object-fit:contain;" />`
    : `<span style="display:inline-block;width:50px;height:50px;border-radius:6px;background:#ffffff;text-align:center;line-height:50px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#008080;">V</span>`;
  const subject = "Thank You for Your Sponsorship — Stichting The V.O.I.C.E. NL";

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

Please upload high-definition logos and other sponsor materials via this secure link:
${values.upload_url}

We are truly grateful for your trust and support. We look forward to showcasing your brand as a valued partner of Stichting The V.O.I.C.E. NL and creating meaningful cultural impact together.

Warm regards,
Stichting The V.O.I.C.E. NL

Stichting The V.O.I.C.E. NL
The Vision of International Cultural Exchange in the Netherlands

Contact Details
Email: info@stichtingthevoice.nl
Website: stichtingthevoice.nl
KVK: 92180213
Office: +31619032104
Follow us:
Facebook: https://www.facebook.com/p/The-VOICE-NL-61552129209396/
Instagram: https://www.instagram.com/stichting_the_voice_nl/?hl=en
YouTube: https://www.youtube.com/@StichtingTheVOICENL
LinkedIn: https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/
X: https://x.com/St_The_VOICE_NL
`;

  const safe = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, escapeHtml(v)])
  );

  const detailCell = (label, valueHtml, borders = "") => `
                              <td class="sponsorship-detail-cell" style="padding:10px 18px 10px 18px;vertical-align:top;${borders}">
                                <p class="sponsorship-detail-label" style="margin:0 0 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;line-height:1.25;color:#10243a;">${label}</p>
                                <p class="sponsorship-detail-value" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;line-height:1.25;color:#008080;">${valueHtml}</p>
                              </td>`;

  const coverageRowsHtml = SPONSORSHIP_COVERAGE.map((tier) => {
    const name = escapeHtml(tier.name);
    const amount = escapeHtml(tier.amountLabel);
    const benefitsText = escapeHtml((tier.benefits || []).join("; "));
    return `
                  <tr>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.2;font-weight:800;color:#10243a;width:16%;">${name}</td>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.2;font-weight:800;color:#008080;width:12%;white-space:nowrap;">${amount}</td>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.45;color:#10243a;">${benefitsText}</td>
                  </tr>`;
  }).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width: 520px) {
      .email-shell {
        padding: 12px 8px !important;
      }
      .email-card {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 8px !important;
      }
      .email-header {
        padding: 18px 18px 22px 18px !important;
      }
      .brand-col {
        display: table-cell !important;
        width: 64% !important;
        max-width: 64% !important;
        vertical-align: middle !important;
      }
      .partner-col {
        display: table-cell !important;
        width: 36% !important;
        max-width: 36% !important;
        vertical-align: middle !important;
      }
      .brand-table {
        width: auto !important;
      }
      .brand-logo-cell {
        width: 42px !important;
        padding-right: 8px !important;
      }
      .email-logo {
        width: 42px !important;
        height: auto !important;
      }
      .brand-stichting {
        font-size: 8px !important;
        letter-spacing: 0.12em !important;
        line-height: 1.15 !important;
      }
      .brand-voice {
        font-size: 10.5px !important;
        letter-spacing: 0.04em !important;
        line-height: 1.2 !important;
      }
      .partner-col {
        padding: 0 0 0 8px !important;
        text-align: right !important;
      }
      .partner-text {
        max-width: 118px !important;
        margin-left: auto !important;
        text-align: right !important;
        font-size: 6.5px !important;
        letter-spacing: 0.08em !important;
        line-height: 1.3 !important;
      }
      .hero-title {
        margin-top: 24px !important;
        font-size: 23px !important;
        line-height: 1.18 !important;
      }
      .content-pad {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }
      .sponsorship-details-title {
        padding: 13px 14px 9px 14px !important;
      }
      .sponsorship-details-title p {
        font-size: 17px !important;
      }
      .sponsorship-detail-row {
        display: block !important;
        width: 100% !important;
      }
      .sponsorship-detail-cell {
        display: block !important;
        width: auto !important;
        padding: 11px 14px !important;
        border-right: 0 !important;
        border-bottom: 1px solid #e5eeee !important;
      }
      .sponsorship-detail-cell-empty {
        display: none !important;
      }
      .sponsorship-detail-label {
        font-size: 10px !important;
      }
      .sponsorship-detail-value {
        font-size: 12px !important;
        line-height: 1.35 !important;
        word-break: break-word !important;
      }
    }
  </style>
</head>
  <body style="margin:0;padding:0;background:#edf5f7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:transparent;">
      Thank you for supporting Stichting The V.O.I.C.E. NL — your sponsorship details are inside.
    </div>
    <table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf5f7;padding:22px 12px;">
      <tr>
        <td align="center">
          <table class="email-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;border-spacing:0;border-collapse:collapse;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(2,69,86,0.12);">
            <tr>
              <td class="email-header" style="background:linear-gradient(118deg,#024556 0%,#003848 54%,#008080 100%);padding:22px 32px 30px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="brand-col" style="vertical-align:middle;width:66%;">
                      <table class="brand-table" role="presentation" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                        <tr>
                          <td class="brand-logo-cell" style="vertical-align:middle;padding:0 14px 0 0;width:56px;">
                            ${logoCell}
                          </td>
                          <td style="vertical-align:middle;padding:0;">
                            <p class="brand-stichting" style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;line-height:1.2;">
                              STICHTING
                            </p>
                            <p class="brand-voice" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#69d4c7;line-height:1.25;">
                              THE V.O.I.C.E. NL
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td class="partner-col" style="vertical-align:top;text-align:right;padding:12px 0 0 12px;">
                      <p class="partner-text" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.11em;text-transform:uppercase;color:#d8eeee;line-height:1.45;text-align:right;max-width:170px;margin-left:auto;">
                        Partner with us.<br/>
                        Create&nbsp;lasting&nbsp;impact.
                      </p>
                    </td>
                  </tr>
                </table>
                <h1 class="hero-title" style="margin:34px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.16;color:#ffffff;">
                  Thank You for Your Sponsorship
                </h1>
                <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:1.45;color:#d8eeee;">
                  Together, we create lasting cultural impact.
                </p>
              </td>
            </tr>
            <tr>
              <td class="content-pad" style="padding:28px 32px 8px 32px;background:#ffffff;">
                <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;color:#10243a;">
                  Dear ${safe.sponsor_name},
                </p>
                <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#10243a;">
                  On behalf of Stichting The V.O.I.C.E. NL, we warmly thank you for your generous sponsorship and for becoming part of our cultural journey.
                </p>
                <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#10243a;">
                  Your support helps us promote international cultural exchange, artistic collaboration, community engagement, and meaningful events that bring people together through film, music, dance, and creative expression.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5eeee;border-radius:10px;background:#fbfefe;box-shadow:0 6px 18px rgba(2,69,86,0.08);">
                  <tr>
                    <td class="sponsorship-details-title" style="padding:14px 18px 10px 18px;border-bottom:1px solid #e5eeee;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#10243a;">Sponsorship Details</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;border-collapse:collapse;">
                        <tr class="sponsorship-detail-row">
                          ${detailCell("Sponsorship Tier", safe.sponsorship_tier, "border-right:1px solid #e5eeee;border-bottom:1px solid #e5eeee;width:50%;")}
                          ${detailCell("Sponsorship Amount", safe.sponsorship_amount, "border-bottom:1px solid #e5eeee;width:50%;")}
                        </tr>
                        <tr class="sponsorship-detail-row">
                          ${detailCell("Payment Date", safe.payment_date, "border-right:1px solid #e5eeee;border-bottom:1px solid #e5eeee;width:50%;")}
                          ${detailCell("Payment Reference", `<span style="font-family:Consolas,Monaco,monospace;font-size:10px;">${safe.stripe_payment_id}</span>`, "border-bottom:1px solid #e5eeee;width:50%;")}
                        </tr>
                        <tr class="sponsorship-detail-row">
                          ${detailCell("Receipt Number", `<span style="font-family:Consolas,Monaco,monospace;font-size:10px;">${safe.receipt_number}</span>`, "border-right:1px solid #e5eeee;width:50%;")}
                          <td class="sponsorship-detail-cell-empty" style="padding:10px 18px 10px 18px;width:50%;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 20px 32px;background:#ffffff;">
                <p style="margin:0 0 14px 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#10243a;">
                  What Your Sponsorship Covers
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5eeee;border-radius:8px;overflow:hidden;background:#ffffff;">
${coverageRowsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;background:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2fafc;border-radius:8px;border:1px solid #d7eeee;">
                  <tr>
                    <td style="width:5px;background:#57b774;font-size:0;line-height:0;">&nbsp;</td>
                    <td style="padding:18px 20px 16px 22px;">
                      <p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#10243a;">
                        To begin preparing your sponsor visibility and promotional materials, please upload your high-definition logo files, media files, promotional materials, brand guidelines, and approved sponsor text through the secure pCloud upload request below.
                      </p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="left" style="padding:0 0 12px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-spacing:0;">
                              <tr>
                                <td align="center" style="border-radius:4px;background:#008080;">
                                  <a href="${safe.upload_url}" style="display:inline-block;padding:11px 20px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                                    Upload sponsor materials
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.55;word-break:break-all;text-align:left;color:#536b74;">
                        <a href="${safe.upload_url}" style="color:#008080;font-weight:700;text-decoration:underline;">${safe.upload_url}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 16px 32px;background:#ffffff;">
                <p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#10243a;">
                  We are truly grateful for your trust and support. We look forward to showcasing your brand as a valued partner of Stichting The V.O.I.C.E. NL and creating meaningful cultural impact together.
                </p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#10243a;">
                  Warm regards,
                </p>
                <p style="margin:3px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;color:#008080;">
                  Stichting The V.O.I.C.E. NL
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;background:#ffffff;">
                <p style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:800;color:#10243a;line-height:1.35;">
                  Stichting The V.O.I.C.E. NL
                </p>
                <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:8px;color:#536b74;line-height:1.35;">
                  The Vision of International Cultural Exchange in the Netherlands
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                  <tr>
                    <td style="vertical-align:top;padding:0 8px 0 0;width:50px;">
                      ${footerLogoCell}
                    </td>
                    <td style="vertical-align:top;padding:0;">
                      <p style="margin:0 0 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:800;color:#10243a;line-height:1.2;">
                        Contact Details
                      </p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:8px;color:#10243a;line-height:1.32;">
                        Email: <a href="mailto:info@stichtingthevoice.nl" style="color:#008080;text-decoration:none;">info@stichtingthevoice.nl</a><br/>
                        Website: <a href="https://stichtingthevoice.nl" style="color:#008080;text-decoration:none;">stichtingthevoice.nl</a><br/>
                        KVK: 92180213<br/>
                        Office: +31619032104
                      </p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;border-spacing:0;">
                  <tr>
                    <td style="padding:0 8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:800;color:#10243a;vertical-align:middle;">
                      Follow us:
                    </td>
                    <td style="padding:0 4px 0 0;"><a href="https://www.facebook.com/p/The-VOICE-NL-61552129209396/" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#1877f2;color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:800;">f</a></td>
                    <td style="padding:0 4px 0 0;"><a href="https://www.instagram.com/stichting_the_voice_nl/?hl=en" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#e4405f;color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:7px;font-weight:800;">ig</a></td>
                    <td style="padding:0 4px 0 0;"><a href="https://www.youtube.com/@StichtingTheVOICENL" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#ff0000;color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:7px;font-weight:800;">yt</a></td>
                    <td style="padding:0 4px 0 0;"><a href="https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#0a66c2;color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:7px;font-weight:800;">in</a></td>
                    <td style="padding:0;"><a href="https://x.com/St_The_VOICE_NL" style="display:inline-block;width:16px;height:16px;border-radius:3px;background:#000000;color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:800;">x</a></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:linear-gradient(90deg,#024556 0%,#003848 50%,#008080 100%);padding:14px 22px;text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#edf5f7;line-height:1.55;">
                  THE VISION OF INTERNATIONAL CULTURAL EXCHANGE IN THE NETHERLANDS.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendSponsorshipEmails(payload) {
  const tx = getTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = buildPlaceholders(payload);

  const logoAtt = loadHeaderLogoAttachment();
  const sponsorMail = buildSponsorEmail(values, { logoCid: logoAtt?.cid || null });

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

  const sponsorAttachments = [
    ...(logoAtt ? [logoAtt] : []),
    ...(pdfBuffer
      ? [
          {
            filename: `Sponsorship-Receipt-${values.receipt_number || "VOICE"}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      : [])
  ];

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

  await Promise.allSettled(tasks);
  return { skipped: false };
}
