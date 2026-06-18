import env from "../config/env.js";
import { getMailFromAddress, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";
import { generateTicketPdfFromDocs } from "./ticketPdfService.js";

const WEBSITE_URL = "https://stichtingthevoice.nl";
const PRIVACY_URL = `${WEBSITE_URL}/privacy-policy`;
const TERMS_URL = `${WEBSITE_URL}/terms-and-conditions`;

const EMAIL_STYLES = `
  body { margin:0;padding:0; }
  img { border:0;line-height:100%;outline:none;text-decoration:none; }
  table { border-collapse:collapse; }
  @media only screen and (max-width: 600px) {
    .email-shell { padding:16px 10px 32px !important; }
    .email-card { border-radius:16px !important; }
    .card-pad { padding:20px 18px !important; }
    .hero-pad { padding:24px 18px 26px !important; }
    .hero-title { font-size:26px !important; }
    .brand-row td { display:block !important; width:100% !important; text-align:left !important; }
    .brand-row .brand-event { padding-top:10px !important; }
    .help-col { display:block !important; width:100% !important; text-align:left !important; padding:0 !important; }
    .help-col-right { padding-top:16px !important; }
    .preheader-row td { display:block !important; width:100% !important; text-align:left !important; }
    .preheader-link { padding-top:8px !important; text-align:left !important; }
  }
`;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}

function formatEventTime(startTime, endTime) {
  if (!startTime) return "—";
  return endTime ? `${startTime} – ${endTime}` : startTime;
}

function formatPurchaseDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}

function eventTagline(event) {
  const description = String(event?.description || "").trim();
  if (description) {
    const firstLine = description.split(/\r?\n/)[0].trim();
    return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
  }
  return env.org.tagline || "The voice of international cultural exchange in the Netherlands";
}

function detailRow(label, value) {
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid rgba(62,198,212,0.14);">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.2px;font-weight:700;color:#6b7d94;text-transform:uppercase;">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#ffffff;font-weight:600;">${value}</p>
    </td>
  </tr>`;
}

function buildTicketEmailText({ order, ticket, event }) {
  const eventTitle = event?.title || "Event";
  const viewUrl = `${env.clientUrl}/events/${event?.slug || event?._id || "event"}/tickets/confirmation/${order.orderNumber}`;
  return `Your ticket for ${eventTitle} is confirmed.

Order: ${order.orderNumber}
Ticket: ${ticket.ticketNumber}
Ticket type: ${ticket.ticketTypeName}
Holder: ${ticket.attendeeName}
Date: ${formatEventDate(event?.date)}
Time: ${formatEventTime(event?.startTime, event?.endTime)}
Venue: ${[event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—"}

Your ticket PDF is attached to this email. Show the QR code at the venue entrance for check-in.

View online: ${viewUrl}

Need help? ${env.org.contactEmail || "info@stichtingthevoice.nl"}
${WEBSITE_URL}

Stichting The V.O.I.C.E. NL`;
}

function buildTicketEmailHtml({ order, ticket, event }, branding = {}) {
  const qrCid = branding.qrCid || null;
  const qrSrc = qrCid ? `cid:${qrCid}` : "";
  const qrCell = qrSrc
    ? `<img src="${qrSrc}" alt="Ticket QR code" width="168" height="168" style="display:block;margin:0 auto;width:168px;max-width:100%;height:auto;aspect-ratio:1/1;border:10px solid #ffffff;border-radius:18px;background:#ffffff;" />`
    : `<div style="width:168px;max-width:100%;aspect-ratio:1/1;margin:0 auto;border:10px solid #ffffff;border-radius:18px;background:#ffffff;color:#98a2b3;font-size:12px;line-height:148px;text-align:center;">QR code</div>`;

  const eventTitle = escapeHtml(event?.title || "Event");
  const venueName = escapeHtml(event?.venueName || "—");
  const venueAddress = escapeHtml(event?.venueAddress || "");
  const venueValue = venueAddress
    ? `${venueName}<br/><span style="font-weight:500;color:#c7d3e6;">${venueAddress}</span>`
    : venueName;
  const viewInBrowserUrl = `${env.clientUrl}/events/${event?.slug || event?._id || "event"}/tickets/confirmation/${order.orderNumber}`;
  const supportEmail = escapeHtml(env.org.contactEmail || "info@stichtingthevoice.nl");
  const tagline = escapeHtml(eventTagline(event));
  const websiteLabel = escapeHtml(WEBSITE_URL.replace(/^https?:\/\//, ""));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your V.O.I.C.E. NL Ticket Confirmation</title>
  <style type="text/css">${EMAIL_STYLES}</style>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="background:#030712;padding:24px 12px 40px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="email-card" style="max-width:600px;width:100%;">

          <tr>
            <td style="padding:0 4px 18px;border-bottom:1px solid rgba(62,198,212,0.12);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="preheader-row">
                <tr>
                  <td style="font-size:12px;line-height:1.5;color:#8a9bb5;">Thank you for your purchase!</td>
                  <td align="right" class="preheader-link" style="font-size:12px;line-height:1.5;">
                    <a href="${escapeHtml(viewInBrowserUrl)}" style="color:#3ec6d4;text-decoration:none;">View in browser</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 4px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="brand-row">
                <tr>
                  <td style="font-size:13px;line-height:1.4;color:#ffffff;font-weight:600;">Stichting The V.O.I.C.E. NL</td>
                  <td align="right" class="brand-event" style="font-size:13px;line-height:1.4;color:#c7d3e6;">${eventTitle}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="hero-pad" style="padding:28px 24px 30px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.18);">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;font-weight:800;color:#3ec6d4;text-transform:uppercase;">Ticket Confirmation</p>
              <h1 class="hero-title" style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-weight:700;">Your Ticket Is Confirmed!</h1>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#d7e0ef;">We are excited to welcome you at <strong style="color:#ffffff;">${eventTitle}</strong>.</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#f06db3;font-weight:600;">${tagline}</p>
            </td>
          </tr>

          <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="card-pad" style="padding:24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#3ec6d4;">Ticket Details</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                ${detailRow("Event", eventTitle)}
                ${detailRow("Date", escapeHtml(formatEventDate(event?.date)))}
                ${detailRow("Time", escapeHtml(formatEventTime(event?.startTime, event?.endTime)))}
                ${detailRow("Venue", venueValue)}
                ${detailRow("Ticket Type", escapeHtml(ticket.ticketTypeName))}
                ${detailRow("Ticket Holder", escapeHtml(ticket.attendeeName))}
                ${detailRow("Order ID", escapeHtml(order.orderNumber))}
                ${detailRow("Purchase Date", escapeHtml(formatPurchaseDate(order.createdAt)))}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
                <tr>
                  <td align="center" style="padding:8px 0 0;">
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:1.4px;font-weight:800;color:#3ec6d4;text-transform:uppercase;">Your QR Code</p>
                    ${qrCell}
                    <p style="margin:14px auto 0;max-width:280px;font-size:12px;line-height:1.6;color:#8a9bb5;text-align:center;">Show this QR code at the venue entrance for check-in.</p>
                    <p style="margin:16px auto 0;max-width:320px;font-size:12px;line-height:1.6;color:#c7d3e6;text-align:center;">Your printable ticket PDF is attached to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="card-pad" style="padding:22px 24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
              <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#3ec6d4;">Important Information</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:#d7e0ef;">
                  <span style="color:#3ec6d4;font-weight:700;margin-right:8px;">•</span>Please arrive at least 30 minutes before the event starts.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:#d7e0ef;">
                  <span style="color:#3ec6d4;font-weight:700;margin-right:8px;">•</span>Tickets are non-refundable and non-transferable unless stated otherwise.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:#d7e0ef;">
                  <span style="color:#3ec6d4;font-weight:700;margin-right:8px;">•</span>Keep your QR code secure and do not share it with others.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:#d7e0ef;">
                  <span style="color:#3ec6d4;font-weight:700;margin-right:8px;">•</span>For updates, visit our website or follow us on social media.
                </td></tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="card-pad" style="padding:20px 24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" class="help-col" style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#3ec6d4;">Need Help?</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#d7e0ef;">Our support team is here for you.</p>
                  </td>
                  <td valign="top" align="right" class="help-col help-col-right" style="width:50%;padding-left:12px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#ffffff;">
                      <span style="color:#3ec6d4;margin-right:8px;">✉</span>
                      <a href="mailto:${supportEmail}" style="color:#ffffff;text-decoration:none;">${supportEmail}</a>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;">
                      <span style="color:#3ec6d4;margin-right:8px;">🌐</span>
                      <a href="${WEBSITE_URL}" style="color:#3ec6d4;text-decoration:none;">${websiteLabel}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td align="center" style="padding:0 12px 8px;">
              <p style="margin:0 0 10px;font-size:18px;color:#3ec6d4;line-height:1;">♥</p>
              <p style="margin:0 0 8px;font-size:18px;line-height:1.4;color:#ffffff;font-weight:700;">Thank You For Supporting Our Mission.</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#8a9bb5;">Together, we inspire change and empower voices.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#ffffff;font-weight:700;">V.O.I.C.E. NL</p>
              <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#6b7d94;">V.O.I.C.E. NL — The Vision Of International Cultural Exchange In The Netherlands</p>
              <p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#6b7d94;">© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</p>
              <p style="margin:0;font-size:12px;line-height:1.6;">
                <a href="${PRIVACY_URL}" style="color:#3ec6d4;text-decoration:none;">Privacy Policy</a>
                <span style="color:#6b7d94;">&nbsp;|&nbsp;</span>
                <a href="${TERMS_URL}" style="color:#3ec6d4;text-decoration:none;">Terms &amp; Conditions</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendTicketConfirmationEmail({ order, ticket, event }) {
  if (!isMailerConfigured()) {
    console.log("[tickets] SMTP not configured — skipping confirmation email for", ticket.ticketNumber);
    return { skipped: true };
  }

  const transporter = getSmtpTransporter();
  const attachments = [];

  if (ticket.verificationToken) {
    try {
      attachments.push({
        filename: "ticket-qr.png",
        content: await generateTicketQrPngBuffer(ticket.verificationToken),
        cid: "ticketQr",
        contentDisposition: "inline",
      });
    } catch (error) {
      console.warn("[tickets] Could not generate QR for email:", error.message);
    }
  }

  try {
    const pdfBuffer = await generateTicketPdfFromDocs(ticket, order, event);
    attachments.push({
      filename: `ticket-${ticket.ticketNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
      contentDisposition: "attachment",
    });
  } catch (error) {
    console.warn("[tickets] Could not generate PDF for email:", error.message);
  }

  const qrCid = attachments.find((a) => a.cid)?.cid || null;
  const html = buildTicketEmailHtml({ order, ticket, event }, { qrCid });
  const text = buildTicketEmailText({ order, ticket, event });
  const eventTitle = event?.title || "V.O.I.C.E. NL Event";

  try {
    await transporter.sendMail({
      from: getMailFromAddress(),
      to: ticket.attendeeEmail,
      subject: `Your ticket for ${eventTitle} — ${ticket.ticketNumber}`,
      text,
      html,
      attachments,
    });
  } catch (error) {
    console.error(
      `[tickets] confirmation email failed for ${ticket.ticketNumber} → ${ticket.attendeeEmail}:`,
      error.message
    );
    throw error;
  }

  return { sent: true };
}

export { buildTicketEmailHtml };
