import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import { resolveDonationPublicContactEmail } from "../config/donationPublicContact.js";
import { getDonationImpactForTier } from "../config/donationImpact.js";
import { getCoverageForTier } from "../config/sponsorshipCoverage.js";
import {
  buildEmailFollowUsRowHtml,
  getEmailSocialIconCids,
  loadEmailSocialIconAttachments
} from "./emailSocialIcons.js";
import { renderDonationReceiptPdf, renderSponsorshipReceiptPdf } from "./receiptPdf.js";
import {
  getMailReplyTo,
  getSmtpTransporter,
  isMailerConfigured
} from "./smtpTransport.js";

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
    console.warn("[mailer] Could not load header-logo.png; sponsor email will omit logo.");
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
    tier_id: payload.tier?.id || "",
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
  const followUsRowHtml = buildEmailFollowUsRowHtml(branding.socialIconCids || {});
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
Email: ${values.contact_email}
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

  const coverageTier = getCoverageForTier(values.tier_id);
  const coverageRowsHtml = coverageTier
    ? (() => {
        const name = escapeHtml(coverageTier.name);
        const amount = escapeHtml(coverageTier.amountLabel);
        const benefitsText = escapeHtml((coverageTier.benefits || []).join("; "));
        return `
                  <tr>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.2;font-weight:800;color:#10243a;width:16%;">${name}</td>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.2;font-weight:800;color:#008080;width:12%;white-space:nowrap;">${amount}</td>
                    <td style="padding:10px 8px;border-bottom:1px solid #e5eeee;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.45;color:#10243a;">${benefitsText}</td>
                  </tr>`;
      })()
    : "";
  const coverageSectionHtml = coverageTier
    ? `
            <tr>
              <td style="padding:10px 32px 20px 32px;background:#ffffff;">
                <p style="margin:0 0 14px 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#10243a;">
                  What Your Sponsorship Covers
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5eeee;border-radius:8px;overflow:hidden;background:#ffffff;">
${coverageRowsHtml}
                </table>
              </td>
            </tr>`
    : "";

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
${coverageSectionHtml}
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
                        Email: <a href="mailto:${safe.contact_email}" style="color:#008080;text-decoration:none;">${safe.contact_email}</a><br/>
                        Website: <a href="https://stichtingthevoice.nl" style="color:#008080;text-decoration:none;">stichtingthevoice.nl</a><br/>
                        KVK: 92180213<br/>
                        Office: +31619032104
                      </p>
                    </td>
                  </tr>
                </table>
                ${followUsRowHtml}
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

function buildDonationPlaceholders(payload) {
  const sponsor = payload.sponsor || {};
  const donationAmount = formatAmount(payload.amountMinor, payload.currency);
  const paymentDate = payload.paymentDate || formatPaymentDate(payload.paymentCreated);
  const transactionId = payload.paymentIntentId || "";
  const donorAddress = [sponsor.organization, sponsor.country].filter(Boolean).join(", ").trim();
  const notesOptional = sponsor.message && String(sponsor.message).trim() ? String(sponsor.message).trim() : "";
  const donorPublicContact = resolveDonationPublicContactEmail(env.org.contactEmail);
  return {
    donor_name: sponsor.name || sponsor.firstName || "Donor",
    company_name: sponsor.organization || "",
    donor_email: sponsor.email || "",
    donor_address: donorAddress,
    notes_optional: notesOptional,
    tier_id: payload.tier?.id || "",
    donation_level: payload.tier?.name || "Donation",
    donation_amount: donationAmount,
    payment_date: paymentDate,
    donation_date: paymentDate,
    transaction_id: transactionId,
    stripe_payment_id: transactionId,
    receipt_number: payload.receiptNumber || "",
    payment_method: payload.paymentMethod || "Card via Stripe",
    contact_email: donorPublicContact,
    website_url: "https://stichtingthevoice.nl",
    email_footer_optional: env.org.emailFooterOptional || ""
  };
}

function buildDonationThankYouEmail(values, branding = {}) {
  const logoCid = branding.logoCid || null;
  const followUsRowHtml = buildEmailFollowUsRowHtml(branding.socialIconCids || {});
  const logoCell = logoCid
    ? `<img src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="48" height="48" style="display:block;width:48px;height:auto;border:0;border-radius:6px;background:#ffffff;object-fit:contain;" />`
    : `<span style="display:inline-block;width:48px;height:48px;border-radius:6px;background:#ffffff;text-align:center;line-height:48px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#26a69a;">V</span>`;
  const footerLogoCell = logoCid
    ? `<img src="cid:${logoCid}" alt="Stichting The V.O.I.C.E. NL" width="50" height="50" style="display:block;width:50px;height:auto;border:0;border-radius:6px;background:#ffffff;object-fit:contain;" />`
    : `<span style="display:inline-block;width:50px;height:50px;border-radius:6px;background:#ffffff;text-align:center;line-height:50px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#008080;">V</span>`;

  const subject = "Thank You for Your Donation to Stichting The V.O.I.C.E. NL";

  const impactTier = getDonationImpactForTier(values.tier_id, {
    amountLabel: values.donation_amount
  });
  const impactTextBlock = impactTier
    ? `Your Donation Makes Possible
${impactTier.amount} | ${impactTier.tier} — ${impactTier.description}
`
    : "";

  const text = `Dear ${values.donor_name},

Thank you so much for your generous donation to Stichting The V.O.I.C.E. NL. Your support empowers art, culture, and community initiatives that inspire, educate, and unite people across the world. Together, we are creating a better tomorrow.

Your Donation Details
Donation Amount: ${values.donation_amount}
Donation Level: ${values.donation_level}
Donation Date: ${values.donation_date}
Transaction ID: ${values.transaction_id}
Payment Method: ${values.payment_method}

${impactTextBlock}Your kindness fuels creativity, strengthens communities, and brings people together across cultures. We are deeply grateful to have you as part of our journey.

Warm regards,
Stichting The V.O.I.C.E. NL

Stichting The V.O.I.C.E. NL
The Vision of International Cultural Exchange in the Netherlands

Contact Details
Email: ${values.contact_email}
Website: stichtingthevoice.nl
KVK: 92180213
Office: +31619032104
Follow us:
Facebook: https://www.facebook.com/p/The-VOICE-NL-61552129209396/
Instagram: https://www.instagram.com/stichting_the_voice_nl/?hl=en
YouTube: https://www.youtube.com/@StichtingTheVOICENL
LinkedIn: https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/
X: https://x.com/St_The_VOICE_NL

Visit Our Website: https://stichtingthevoice.nl
Email Us: ${values.contact_email}
THE VISION OF INTERNATIONAL CULTURAL EXCHANGE IN THE NETHERLANDS.

${values.email_footer_optional ? values.email_footer_optional + "\n" : ""}
Your official donation receipt is attached to this email for your records.
`;

  const safe = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, escapeHtml(v)])
  );

  const impactRowsHtml = impactTier
    ? `<tr class="donate-impact-row">
                  <td class="donate-impact-amt" style="vertical-align:top;padding:14px 12px 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#26a69a;white-space:nowrap;">${escapeHtml(impactTier.amount)}</td>
                  <td class="donate-impact-tier" style="vertical-align:top;padding:14px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#333333;">${escapeHtml(impactTier.tier)}</td>
                  <td class="donate-impact-desc" style="vertical-align:top;padding:14px 0 14px 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:400;line-height:1.6;color:#333333;">${escapeHtml(impactTier.description)}</td>
                </tr>`
    : "";
  const impactSectionHtml = impactTier
    ? `
              <p class="donate-impact-title" style="margin:36px 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:#004b50;text-align:center;">
                Your Donation Makes Possible
              </p>
              <table class="donate-impact-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;border-collapse:collapse;">
${impactRowsHtml}
              </table>
`
    : "";

  const footerOptionalHtml =
    safe.email_footer_optional && String(safe.email_footer_optional).trim()
      ? `<p class="donate-email-optional-footer" style="margin:18px auto 0;max-width:620px;padding:0 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#777777;text-align:center;">${safe.email_footer_optional}</p>`
      : "";

  const donateEmailSignatureHtml = `
          <tr>
            <td class="donate-email-signature" style="padding:0 40px 28px 40px;background:#ffffff;">
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
                      Email: <a href="mailto:${safe.contact_email}" style="color:#008080;text-decoration:none;">${safe.contact_email}</a><br/>
                      Website: <a href="https://stichtingthevoice.nl" style="color:#008080;text-decoration:none;">stichtingthevoice.nl</a><br/>
                      KVK: 92180213<br/>
                      Office: +31619032104
                    </p>
                  </td>
                </tr>
              </table>
              ${followUsRowHtml}
            </td>
          </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    .donate-email-card { border-collapse: separate !important; }
    /* Impact tier list: horizontal rules only (no outer box on desktop) */
    .donate-impact-table { border: none !important; border-radius: 0 !important; }
    /* Desktop: footer column alignment */
    .donate-email-footer-col--left { text-align: left !important; }
    .donate-email-footer-col--mid { text-align: center !important; }
    .donate-email-footer-col--right { text-align: right !important; }
    /* Tablet */
    @media only screen and (max-width: 768px) {
      .donate-email-shell { padding: 20px 14px !important; }
      .donate-email-card { width: 100% !important; max-width: 100% !important; border-radius: 16px !important; }
      .donate-email-header { padding: 22px 22px 28px !important; }
      .donate-email-header-strip td { vertical-align: middle !important; }
      .donate-email-body { padding: 32px 22px 28px !important; }
      .donate-email-signature { padding: 0 22px 24px 22px !important; }
      .donate-email-hero { font-size: 28px !important; margin-top: 22px !important; text-align: center !important; }
      .donate-email-hero-wrap td { text-align: center !important; }
      .donate-email-sub { text-align: center !important; margin-left: auto !important; margin-right: auto !important; max-width: 36ch !important; color: #ffffff !important; }
      .donate-email-hero-wrap td { padding-top: 18px !important; }
      .donate-email-header-top .donate-email-brand-col,
      .donate-email-header-top .donate-email-tagline-col { display: block !important; width: 100% !important; }
      .donate-email-tagline-col { text-align: center !important; padding: 12px 0 0 !important; }
      .donate-email-tagline-col p { text-align: center !important; margin-left: auto !important; margin-right: auto !important; max-width: 100% !important; }
      .donate-details-cell { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; border-right: none !important; border-bottom: 1px solid #e0e0e0 !important; }
      .donate-details-inner tr:last-child .donate-details-cell { border-bottom: none !important; }
      .donate-impact-table .donate-impact-row .donate-impact-amt,
      .donate-impact-table .donate-impact-row .donate-impact-tier,
      .donate-impact-table .donate-impact-row .donate-impact-desc { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; padding-left: 0 !important; padding-right: 0 !important; }
      .donate-impact-table .donate-impact-row .donate-impact-amt { border: none !important; text-align: center !important; padding: 14px 12px 4px !important; white-space: normal !important; }
      .donate-impact-table .donate-impact-row .donate-impact-tier { border: none !important; text-align: center !important; font-size: 15px !important; padding: 0 12px 10px !important; }
      .donate-impact-table .donate-impact-row .donate-impact-desc { border: none !important; text-align: center !important; padding: 0 16px 22px !important; border-bottom: 1px solid #e8ecec !important; }
      .donate-impact-table .donate-impact-row:last-child .donate-impact-desc { border-bottom: none !important; padding-bottom: 12px !important; }
      .donate-email-footer-row .donate-email-footer-col { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; text-align: center !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.2) !important; padding: 20px 24px !important; }
      .donate-email-footer-row .donate-email-footer-col:last-child { border-bottom: none !important; padding-bottom: 26px !important; }
      .donate-email-footer-right p { text-align: center !important; }
      .donate-email-footer-col--left,
      .donate-email-footer-col--mid,
      .donate-email-footer-col--right { text-align: center !important; }
    }
    /* Mobile */
    @media only screen and (max-width: 600px) {
      .donate-email-shell { padding: 12px 10px !important; }
      .donate-email-card { border-radius: 14px !important; }
      .donate-email-header { padding: 18px 16px 22px !important; }
      .donate-email-body { padding: 26px 16px 22px !important; }
      .donate-email-signature { padding: 0 16px 22px 16px !important; }
      .donate-email-hero { font-size: 24px !important; line-height: 1.2 !important; margin-top: 18px !important; }
      .donate-email-sub { font-size: 13px !important; max-width: 100% !important; color: #ffffff !important; }
      .donate-email-tagline-col p { font-size: 7.5px !important; letter-spacing: 0.07em !important; line-height: 1.45 !important; }
      .donate-email-brand-col { text-align: center !important; }
      .donate-email-brand-inner { margin: 0 auto !important; }
      .donate-email-brand-inner tr td:first-child { display: block !important; text-align: center !important; padding: 0 0 10px 0 !important; }
      .donate-email-brand-inner tr td:last-child { display: block !important; text-align: center !important; padding: 0 !important; }
      .donate-details-wrap { padding: 16px 14px 14px !important; }
      .donate-details-title { font-size: 15px !important; }
      .donate-impact-title { font-size: 17px !important; margin-top: 28px !important; }
      .donate-email-footer-row .donate-email-footer-col { padding: 18px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#edf5f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:transparent;">
    Thank you for your donation to Stichting The V.O.I.C.E. NL.
  </div>
  <table class="donate-email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf5f7;padding:28px 16px;">
    <tr>
      <td align="center">
        <table class="donate-email-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;border-spacing:0;border-collapse:separate;border-radius:18px;overflow:hidden;box-shadow:0 10px 32px rgba(0,50,55,0.14);background:#ffffff;">
          <tr>
            <td class="donate-email-header" style="background:linear-gradient(118deg,#024556 0%,#003848 54%,#008080 100%);padding:28px 36px 36px;">
              <table class="donate-email-header-strip donate-email-header-top" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                <tr>
                  <td class="donate-email-brand-col" width="52%" style="vertical-align:middle;">
                    <table class="donate-email-brand-inner" role="presentation" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                      <tr>
                        <td style="vertical-align:middle;padding:0 14px 0 0;">${logoCell}</td>
                        <td style="vertical-align:middle;padding:0;">
                          <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;line-height:1.35;">
                            STICHTING
                          </p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c8f5a8;line-height:1.35;">
                            THE V.O.I.C.E. NL
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="donate-email-tagline-col" width="48%" style="vertical-align:middle;text-align:right;padding:0;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;line-height:1.5;text-align:right;">
                      ARTS&nbsp;&nbsp;CULTURE&nbsp;&nbsp;COMMUNITY&nbsp;&nbsp;<span style="color:#d8f28c;">TOMORROW</span>
                    </p>
                  </td>
                </tr>
              </table>
              <table class="donate-email-hero-wrap" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                <tr>
                  <td style="padding:22px 0 0;">
                    <h1 class="donate-email-hero" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:700;line-height:1.15;color:#ffffff;text-align:left;">
                      Thank You for Your Donation
                    </h1>
                    <p class="donate-email-sub" style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;line-height:1.65;color:#ffffff;text-align:left;">
                      Your generosity helps us create cultural impact.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="donate-email-body" style="padding:40px 40px 32px;background:#ffffff;">
              <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#004b50;">
                Dear ${safe.donor_name},
              </p>
              <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;line-height:1.75;color:#333333;">
                Thank you so much for your generous donation to Stichting The V.O.I.C.E. NL. Your support empowers art, culture, and community initiatives that inspire, educate, and unite people across the world. Together, we are creating a better tomorrow.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;border-radius:14px;border-spacing:0;">
                <tr>
                  <td class="donate-details-wrap" style="padding:22px 24px 20px;">
                    <p class="donate-details-title" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#004b50;text-align:left;">
                      Your Donation Details
                    </p>
                    <table class="donate-details-inner" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;border-collapse:collapse;border:1px solid #e0e0e0;">
                      <tr>
                        <td class="donate-details-cell" width="50%" style="vertical-align:top;padding:16px 18px;border-right:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;">
                          <p class="donate-detail-label" style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#333333;">Donation Amount</p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#26a69a;">${safe.donation_amount}</p>
                        </td>
                        <td class="donate-details-cell donate-details-cell--right" width="50%" style="vertical-align:top;padding:16px 18px;border-bottom:1px solid #e0e0e0;">
                          <p class="donate-detail-label" style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#333333;">Donation Level</p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#26a69a;">${safe.donation_level}</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="donate-details-cell" width="50%" style="vertical-align:top;padding:16px 18px;border-right:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;">
                          <p class="donate-detail-label" style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#333333;">Donation Date</p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#26a69a;">${safe.donation_date}</p>
                        </td>
                        <td class="donate-details-cell donate-details-cell--right" width="50%" style="vertical-align:top;padding:16px 18px;border-bottom:1px solid #e0e0e0;">
                          <p class="donate-detail-label" style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#333333;">Transaction ID</p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#26a69a;word-break:break-all;">${safe.transaction_id}</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="donate-details-cell" colspan="2" style="vertical-align:top;padding:16px 18px;">
                          <p class="donate-detail-label" style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#333333;">Payment Method</p>
                          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#26a69a;">${safe.payment_method}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

${impactSectionHtml}
              <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.75;color:#333333;">
                Your kindness fuels creativity, strengthens communities, and brings people together across cultures. We are deeply grateful to have you as part of our journey.
              </p>
              <p style="margin:22px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;color:#333333;">Warm regards,</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#008080;">Stichting The V.O.I.C.E. NL</p>
            </td>
          </tr>
          ${donateEmailSignatureHtml}
          <tr>
            <td style="background:linear-gradient(90deg,#024556 0%,#003848 50%,#008080 100%);padding:0;">
              <table class="donate-email-footer-row" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0;">
                <tr>
                  <td class="donate-email-footer-col donate-email-footer-col--left" width="32%" style="vertical-align:top;padding:28px 20px 32px 36px;border-right:1px solid rgba(255,255,255,0.22);text-align:left;">
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">Visit Our Website</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;">
                      <a href="https://stichtingthevoice.nl" style="color:#d8f28c;text-decoration:underline;">https://stichtingthevoice.nl</a>
                    </p>
                  </td>
                  <td class="donate-email-footer-col donate-email-footer-col--mid" width="36%" style="vertical-align:top;padding:28px 20px 32px;border-right:1px solid rgba(255,255,255,0.22);text-align:center;">
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">Email Us</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;">
                      <a href="mailto:${safe.contact_email}" style="color:#d8f28c;text-decoration:underline;">${safe.contact_email}</a>
                    </p>
                  </td>
                  <td class="donate-email-footer-col donate-email-footer-col--right donate-email-footer-right" width="32%" style="vertical-align:top;padding:28px 36px 32px 20px;text-align:right;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.11em;text-transform:uppercase;color:#ffffff;line-height:1.7;">
                      THE VISION OF INTERNATIONAL<br/>
                      CULTURAL EXCHANGE<br/>
                      IN THE NETHERLANDS.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ${footerOptionalHtml}
        <p style="margin:18px auto 0;max-width:620px;padding:0 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#888888;text-align:center;">
          Your official donation receipt is attached to this email for your records.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function baseMailOptions() {
  return {
    from: env.email.from,
    replyTo: getMailReplyTo()
  };
}

function buildOrgDonationNotifyText(values) {
  return [
    "New donation received via the website.",
    "",
    `Donor: ${values.donor_name}`,
    `Email: ${values.donor_email}`,
    `Amount: ${values.donation_amount}`,
    `Level: ${values.donation_level}`,
    `Receipt: ${values.receipt_number || "—"}`,
    `Stripe: ${values.stripe_payment_id || "—"}`
  ].join("\n");
}

function buildOrgSponsorshipNotifyText(values) {
  return [
    "New sponsorship received via the website.",
    "",
    `Sponsor: ${values.sponsor_name}`,
    `Email: ${values.sponsor_email}`,
    `Company: ${values.company_name || "—"}`,
    `Tier: ${values.sponsorship_tier}`,
    `Amount: ${values.sponsorship_amount}`,
    `Receipt: ${values.receipt_number || "—"}`,
    `Stripe: ${values.stripe_payment_id || "—"}`
  ].join("\n");
}

export async function sendNewsletterSubscribeEmails({ email }) {
  const tx = getSmtpTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Newsletter email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const subscriber = String(email || "").trim();
  const notifyTo = env.email.orgNotify || env.org.contactEmail;
  const base = baseMailOptions();

  await tx.sendMail({
    ...base,
    to: subscriber,
    subject: "You are subscribed — Stichting The V.O.I.C.E. NL",
    text: `Thank you for subscribing to updates from Stichting The V.O.I.C.E. NL.\n\nYou will hear from us about events, stories, and impact.\n\nQuestions? Reply to this email or write to ${env.org.contactEmail}.`,
    html: `
      <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
        <h1 style="color:#0d2847;font-size:22px;">Thank you for subscribing</h1>
        <p>You will receive updates on events, stories, and impact from Stichting The V.O.I.C.E. NL.</p>
        <p style="font-size:13px;color:#7a8ea3;">Questions? Contact us at <a href="mailto:${escapeHtml(env.org.contactEmail)}">${escapeHtml(env.org.contactEmail)}</a>.</p>
      </div>
    `
  });

  if (notifyTo && notifyTo.toLowerCase() !== subscriber.toLowerCase()) {
    await tx.sendMail({
      ...base,
      to: notifyTo,
      subject: `Newsletter signup: ${subscriber}`,
      text: `New newsletter subscription from the website footer.\n\nEmail: ${subscriber}`
    });
  }

  return { skipped: false };
}

export async function sendDonationEmails(payload) {
  const tx = getSmtpTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Donation email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = buildDonationPlaceholders(payload);
  const logoAtt = loadHeaderLogoAttachment();
  const socialIconAtts = loadEmailSocialIconAttachments();
  const socialIconCids = getEmailSocialIconCids();
  const donorMail = buildDonationThankYouEmail(values, {
    logoCid: logoAtt?.cid || null,
    socialIconCids
  });

  let pdfBuffer = null;
  try {
    pdfBuffer = await renderDonationReceiptPdf({
      receiptNumber: values.receipt_number,
      stripePaymentId: values.stripe_payment_id,
      paymentDate: values.payment_date,
      donorName: values.donor_name,
      donorEmail: values.donor_email,
      donorAddress: values.donor_address,
      notesOptional: values.notes_optional,
      tierId: values.tier_id,
      donationLevel: values.donation_level,
      donationAmount: values.donation_amount,
      paymentMethod: values.payment_method,
      websiteUrl: values.website_url,
      contactEmail: values.contact_email,
      orgTagline: env.org.tagline
    });
  } catch (error) {
    console.error("[mailer] Failed to render donation PDF receipt:", error.message);
  }

  const attachments = [
    ...(logoAtt ? [logoAtt] : []),
    ...socialIconAtts,
    ...(pdfBuffer
      ? [
          {
            filename: `Donation-Receipt-${values.receipt_number || "VOICE"}.pdf`,
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
        ...baseMailOptions(),
        to: payload.sponsor.email,
        subject: donorMail.subject,
        text: donorMail.text,
        html: donorMail.html,
        attachments
      })
    );
  }

  if (env.email.orgNotify) {
    tasks.push(
      tx.sendMail({
        ...baseMailOptions(),
        to: env.email.orgNotify,
        subject: `New donation: ${values.donation_amount} — ${values.donor_name}`,
        text: buildOrgDonationNotifyText(values)
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}

export async function sendSponsorshipEmails(payload) {
  const tx = getSmtpTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = buildPlaceholders(payload);

  const logoAtt = loadHeaderLogoAttachment();
  const socialIconAtts = loadEmailSocialIconAttachments();
  const socialIconCids = getEmailSocialIconCids();
  const sponsorMail = buildSponsorEmail(values, {
    logoCid: logoAtt?.cid || null,
    socialIconCids
  });

  let pdfBuffer = null;
  try {
    pdfBuffer = await renderSponsorshipReceiptPdf({
      receiptNumber: values.receipt_number,
      stripePaymentId: values.stripe_payment_id,
      paymentDate: values.payment_date,
      sponsorName: values.sponsor_name,
      sponsorEmail: values.sponsor_email,
      companyName: values.company_name,
      tierId: values.tier_id,
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
    ...socialIconAtts,
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
        ...baseMailOptions(),
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
        ...baseMailOptions(),
        to: env.email.orgNotify,
        subject: `New sponsorship: ${values.sponsorship_tier} — ${values.sponsor_name}`,
        text: buildOrgSponsorshipNotifyText(values)
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}
