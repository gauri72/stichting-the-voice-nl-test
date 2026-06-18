import env from "../config/env.js";
import { getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { buildTicketQrImageUrl, generateTicketQrPngBuffer } from "./ticketQrService.js";

const WEBSITE_URL = "https://stichtingthevoice.nl";
const PRIVACY_URL = `${WEBSITE_URL}/privacy-policy`;
const TERMS_URL = `${WEBSITE_URL}/terms-and-conditions`;

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
    <td style="padding:14px 0;border-bottom:1px solid rgba(62,198,212,0.12);">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.2px;font-weight:700;color:#6b7d94;text-transform:uppercase;">${escapeHtml(label)}</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#ffffff;font-weight:600;">${value}</p>
    </td>
  </tr>`;
}

function buildTicketEmailHtml({ order, ticket, event }, branding = {}) {
  const qrCid = branding.qrCid || null;
  const qrSrc = qrCid
    ? `cid:${qrCid}`
    : ticket.verificationToken
      ? buildTicketQrImageUrl(ticket.verificationToken)
      : "";
  const qrCell = qrSrc
    ? `<img src="${qrSrc}" alt="Ticket QR code" width="168" height="168" style="display:block;margin:0 auto;width:168px;height:168px;border:10px solid #ffffff;border-radius:18px;background:#ffffff;" />`
    : `<div style="width:168px;height:168px;margin:0 auto;border:10px solid #ffffff;border-radius:18px;background:#ffffff;color:#98a2b3;font-size:12px;line-height:168px;text-align:center;">QR code</div>`;

  const eventTitle = escapeHtml(event?.title || "Event");
  const venueName = escapeHtml(event?.venueName || "—");
  const venueAddress = escapeHtml(event?.venueAddress || "");
  const venueValue = venueAddress
    ? `${venueName}<br/><span style="font-weight:500;color:#c7d3e6;">${venueAddress}</span>`
    : venueName;
  const viewInBrowserUrl = `${env.clientUrl}/events/${event?.slug || event?._id || "event"}/tickets/confirmation/${order.orderNumber}`;
  const supportEmail = escapeHtml(env.org.contactEmail || "info@stichtingthevoice.nl");
  const tagline = escapeHtml(eventTagline(event));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your V.O.I.C.E. NL Ticket Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030712;padding:24px 12px 40px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

          <tr>
            <td style="padding:0 4px 18px;border-bottom:1px solid rgba(62,198,212,0.12);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:12px;color:#8a9bb5;">Thank you for your purchase!</td>
                  <td align="right" style="font-size:12px;">
                    <a href="${escapeHtml(viewInBrowserUrl)}" style="color:#3ec6d4;text-decoration:none;">View in browser</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 4px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:13px;color:#ffffff;font-weight:600;">Stichting The V.O.I.C.E. NL</td>
                  <td align="right" style="font-size:13px;color:#c7d3e6;">${eventTitle}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px 30px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.18);background-image:radial-gradient(circle at 88% 18%, rgba(209,0,127,0.22) 0%, rgba(6,16,31,0) 52%);">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;font-weight:800;color:#3ec6d4;text-transform:uppercase;">Ticket Confirmation</p>
              <h1 style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-weight:700;">Your Ticket Is Confirmed!</h1>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#d7e0ef;">We are excited to welcome you at <strong style="color:#ffffff;">${eventTitle}</strong>.</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#f06db3;font-weight:600;">${tagline}</p>
            </td>
          </tr>

          <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td style="padding:24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" style="width:58%;padding-right:18px;">
                    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#3ec6d4;">Ticket Details</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${detailRow("Event", eventTitle)}
                      ${detailRow("Date", escapeHtml(formatEventDate(event?.date)))}
                      ${detailRow("Time", escapeHtml(formatEventTime(event?.startTime, event?.endTime)))}
                      ${detailRow("Venue", venueValue)}
                      ${detailRow("Ticket Type", escapeHtml(ticket.ticketTypeName))}
                      ${detailRow("Ticket Holder", escapeHtml(ticket.attendeeName))}
                      ${detailRow("Order ID", escapeHtml(order.orderNumber))}
                      ${detailRow("Purchase Date", escapeHtml(formatPurchaseDate(order.createdAt)))}
                    </table>
                  </td>
                  <td valign="top" align="center" style="width:42%;padding-left:6px;">
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:1.4px;font-weight:800;color:#3ec6d4;text-transform:uppercase;">Your QR Code</p>
                    ${qrCell}
                    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#8a9bb5;text-align:center;">Show this QR code at the venue entrance for check-in.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td style="padding:22px 24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
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
            <td style="padding:20px 24px;background:#06101f;border-radius:18px;border:1px solid rgba(62,198,212,0.22);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#3ec6d4;">Need Help?</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#d7e0ef;">Our support team is here for you.</p>
                  </td>
                  <td valign="top" align="right" style="width:50%;padding-left:12px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#ffffff;">
                      <span style="color:#3ec6d4;margin-right:8px;">✉</span>
                      <a href="mailto:${supportEmail}" style="color:#ffffff;text-decoration:none;">${supportEmail}</a>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;">
                      <span style="color:#3ec6d4;margin-right:8px;">🌐</span>
                      <a href="${WEBSITE_URL}" style="color:#3ec6d4;text-decoration:none;">${WEBSITE_URL.replace(/^https?:\/\//, "")}</a>
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

  let qrAtt = null;
  if (ticket.verificationToken) {
    try {
      qrAtt = {
        filename: "ticket-qr.png",
        content: await generateTicketQrPngBuffer(ticket.verificationToken),
        cid: "ticketQr",
        contentDisposition: "inline",
      };
    } catch (error) {
      console.warn("[tickets] Could not generate QR for email:", error.message);
    }
  }

  const html = buildTicketEmailHtml({ order, ticket, event }, { qrCid: qrAtt?.cid || null });
  const eventTitle = event?.title || "V.O.I.C.E. NL Event";

  await transporter.sendMail({
    from: env.email.from || env.email.membershipFrom,
    to: ticket.attendeeEmail,
    subject: `Your ticket for ${eventTitle} — ${ticket.ticketNumber}`,
    html,
    attachments: qrAtt ? [qrAtt] : [],
  });

  return { sent: true };
}

export { buildTicketEmailHtml };
