import env from "../config/env.js";
import { getMailFromAddress, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";
import { generateOrderTicketsPdfFromDocs, generateTicketPdfFromDocs } from "./ticketPdfService.js";
import { escapeHtml } from "../utils/escapeHtml.js";

const WEBSITE_URL = "https://stichtingthevoice.nl";
const PRIVACY_URL = `${WEBSITE_URL}/privacy-policy`;
const TERMS_URL = `${WEBSITE_URL}/terms-and-conditions`;

// Amsterdam Flames is a partner-branded event: its ticket emails render in the
// club's own dark/flame-orange identity with no V.O.I.C.E. NL branding, though
// support/legal links stay functional (V.O.I.C.E. NL still fulfills the order).
const AMSTERDAM_FLAMES_EVENT_SLUG = "amsterdam-flames-night-of-the-stars";

const DEFAULT_EMAIL_BRANDING = {
  bg: "#030712",
  panelBg: "#06101f",
  cardBg: "#081628",
  panelBorder: "rgba(62,198,212,0.22)",
  accent: "#3ec6d4",
  mutedText: "#8a9bb5",
  bodyText: "#d7e0ef",
  fromName: "Stichting The V.O.I.C.E. NL",
  brandRowLabel: "Stichting The V.O.I.C.E. NL",
  footerName: "V.O.I.C.E. NL",
  footerTagline: "V.O.I.C.E. NL — The Vision Of International Cultural Exchange In The Netherlands",
  footerCopyright: "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.",
  missionTitle: "Thank You For Supporting Our Mission.",
  missionSubtitle: "Together, we inspire change and empower voices.",
  fontFamily: "'Segoe UI',Helvetica,Arial,sans-serif",
  headingFontFamily: "Georgia,'Times New Roman',serif",
  emailTitle: "Your V.O.I.C.E. NL Ticket Confirmation",
  textSignature: "Stichting The V.O.I.C.E. NL",
};

const AMSTERDAM_FLAMES_EMAIL_BRANDING = {
  bg: "#050505",
  panelBg: "#0f0f0f",
  cardBg: "#0f0f0f",
  panelBorder: "rgba(240,94,60,0.25)",
  accent: "#f05e3c",
  mutedText: "#a1a1a1",
  bodyText: "#e5e5e5",
  fromName: "Amsterdam Flames",
  brandRowLabel: "Amsterdam Flames",
  footerName: "AMSTERDAM FLAMES",
  footerTagline: "Bring the heat. Everyone's welcome by the fire.",
  footerCopyright: "© 2026 Amsterdam Flames. All rights reserved.",
  missionTitle: "See You By The Fire.",
  missionSubtitle: "One team. One night. A celebration of stars.",
  fontFamily: "'Archivo',Arial,sans-serif",
  headingFontFamily: "'Archivo Black',Arial,sans-serif",
  emailTitle: "Your Amsterdam Flames Ticket Confirmation",
  textSignature: "Amsterdam Flames",
};

export function getEmailBranding(event) {
  return event?.slug === AMSTERDAM_FLAMES_EVENT_SLUG
    ? AMSTERDAM_FLAMES_EMAIL_BRANDING
    : DEFAULT_EMAIL_BRANDING;
}

// One-time "day of" notice for Amsterdam Flames Night Of Stars, appended to
// every ticket/VIP-pass email for this event (original sends and resends
// alike) once this went out. Gated by event slug rather than threaded through
// every mailer call site, same pattern as AF_VIP_WELCOME_MESSAGE below.
const AMSTERDAM_FLAMES_FINAL_DAY_NOTICE = {
  title: "Tonight's Final Details",
  venueChangeLabel: "Important Venue Update",
  venueChange: "Please note that Night of Stars will now take place at Leonardo Hotel Den Haag Babylon, Bezuidenhoutseweg 53, 2595 AA Den Haag. We look forward to welcoming you there!",
  dressCode: "Formal attire — suits or blazers recommended.",
  parking: "Q-Park Central Station New Babylon at Prinses Irenestraat 1, 2595 BD Den Haag — adjacent to the hotel, open 24/7, with 1,248 spaces.",
  reception: "On arrival, please ask at the hotel reception for directions to the event venue hall.",
};

export function hasFinalDayNotice(event) {
  return event?.slug === AMSTERDAM_FLAMES_EVENT_SLUG;
}

export function isAmsterdamFlamesEvent(event) {
  return event?.slug === AMSTERDAM_FLAMES_EVENT_SLUG;
}

// Same crest asset used by the PDF generator (ticketPdfService.js's
// AF_LOGO_PATH) and the public event page, referenced here by its hosted
// URL since email clients can't load a local file path.
const AF_CREST_URL = `${WEBSITE_URL}/amsterdam-flames/af-crest-orange.png`;

export function buildAmsterdamFlamesHeaderHtml() {
  return `<tr><td style="padding:0 4px 18px;">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="padding-right:10px;"><img src="${AF_CREST_URL}" alt="Amsterdam Flames" width="40" height="40" style="display:block;width:40px;height:40px;" /></td>
        <td style="font-size:20px;font-weight:900;font-family:'Archivo Black',Arial,sans-serif;letter-spacing:0.5px;">
          <span style="color:#ffffff;">Amsterdam</span><span style="color:#f05e3c;">Flames</span>
        </td>
      </tr></table>
    </td></tr>`;
}

function finalDayNoticeBulletRow(bodyText, label, text) {
  return `<tr><td style="padding:0 0 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td valign="top" style="width:20px;padding:2px 8px 0 0;"><img src="${AF_CREST_URL}" alt="" width="14" height="14" style="display:block;width:14px;height:14px;" /></td>
        <td style="font-size:14px;line-height:1.7;color:${bodyText};">${label ? `<strong style="color:#fff;">${escapeHtml(label)}:</strong> ` : ""}${escapeHtml(text)}</td>
      </tr></table>
    </td></tr>`;
}

export function buildFinalDayNoticeHtml({ accent, bodyText, panelBg, border }) {
  const n = AMSTERDAM_FLAMES_FINAL_DAY_NOTICE;
  return `<tr><td class="card-pad" style="padding:22px 24px;background:${panelBg};border-radius:18px;border:1px solid ${border};">
      <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:${accent};">${escapeHtml(n.title)}</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${bodyText};"><strong style="color:${accent};">${escapeHtml(n.venueChangeLabel)}:</strong> ${escapeHtml(n.venueChange)}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${finalDayNoticeBulletRow(bodyText, "Dress Code", n.dressCode)}
        ${finalDayNoticeBulletRow(bodyText, "Parking", n.parking)}
        ${finalDayNoticeBulletRow(bodyText, "On Arrival", n.reception)}
      </table>
      <p style="margin:16px 0 0;font-size:14px;font-weight:700;line-height:1.7;color:#fff;">Your ticket details are below.</p>
    </td></tr>
    <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export function buildFinalDayNoticeText() {
  const n = AMSTERDAM_FLAMES_FINAL_DAY_NOTICE;
  return `\n${n.title}\n${n.venueChangeLabel}: ${n.venueChange}\n\n- Dress Code: ${n.dressCode}\n- Parking: ${n.parking}\n- On Arrival: ${n.reception}\n\nYour ticket details are below.\n`;
}

// Swaps only the display name on the configured From header, keeping the same
// underlying mailbox address (there's no separate Amsterdam Flames mailbox —
// V.O.I.C.E. NL still sends/fulfills the mail).
export function buildFromHeader(event) {
  const branding = getEmailBranding(event);
  const configured = getMailFromAddress();
  const match = /^(.*)<(.+)>$/.exec(configured || "");
  const address = match ? match[2].trim() : configured;
  return address ? `${branding.fromName} <${address}>` : configured;
}

export function hexToRgba(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

function visibleCheckoutAnswers(order, key) {
  return (order?.checkoutAnswers || [])
    .filter((a) => a?.visibility?.[key])
    .map((a) => ({ label: a.questionLabel, answer: a.answer }));
}

// Guest (no account) orders need ?email= for the confirmation page's guest
// lookup to succeed — logged-in orders resolve via the viewer's own session.
function buildOrderViewUrl(order, event) {
  const base = `${env.clientUrl}/events/${event?.slug || event?._id || "event"}/tickets/confirmation/${order.orderNumber}`;
  if (order.userId) return base;
  const email = String(order.attendeeEmail || "").trim();
  return email ? `${base}?email=${encodeURIComponent(email)}` : base;
}

function buildTicketEmailText({ order, ticket, event, updateNotice = "", updateChanges = [] }) {
  const branding = getEmailBranding(event);
  const eventTitle = event?.title || "Event";
  const viewUrl = buildOrderViewUrl(order, event);
  const seatLines = ticket.row || ticket.seatNumber
    ? `\nYour seat:\nSection: ${ticket.section || "—"}\nRow: ${ticket.row || "—"}\nSeat: ${ticket.seatNumber || "—"}\n`
    : "";
  const extra = visibleCheckoutAnswers(order, "showInEmail")
    .slice(0, 8)
    .map((a) => `${a.label}: ${Array.isArray(a.answer) ? a.answer.join(", ") : a.answer ?? "—"}`)
    .join("\n");
  const changeText = updateChanges.length
    ? `\nWhat changed:\n${updateChanges.map((change) => `- ${change.label}: ${change.from || "—"} → ${change.to || "—"}`).join("\n")}\n`
    : "";
  return `${updateNotice ? `Your ticket has been updated: ${updateNotice}${changeText}` : `Your ticket for ${eventTitle} is confirmed.`}
${hasFinalDayNotice(event) ? buildFinalDayNoticeText() : ""}
Order: ${order.orderNumber}
Ticket: ${ticket.ticketNumber}
Ticket type: ${ticket.ticketTypeName}
Holder: ${ticket.attendeeName}
Date: ${formatEventDate(event?.date)}
Time: ${formatEventTime(event?.startTime, event?.endTime)}
Venue: ${[event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—"}${seatLines}
${extra ? `\nCheckout details:\n${extra}\n` : ""}
Your ticket PDF is attached to this email. Show the QR code at the venue entrance for check-in.

View online: ${viewUrl}

Need help? ${env.org.contactEmail || "info@stichtingthevoice.nl"}
${WEBSITE_URL}

${branding.textSignature}`;
}

function buildTicketEmailHtml({ order, ticket, event, updateNotice = "", updateChanges = [] }, extra = {}) {
  const branding = getEmailBranding(event);
  const qrCid = extra.qrCid || null;
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
  const viewInBrowserUrl = buildOrderViewUrl(order, event);
  const supportEmail = escapeHtml(env.org.contactEmail || "info@stichtingthevoice.nl");
  const tagline = escapeHtml(eventTagline(event));
  const websiteLabel = escapeHtml(WEBSITE_URL.replace(/^https?:\/\//, ""));
  const seatDetailRows = ticket.row || ticket.seatNumber
    ? `${detailRow("Section", escapeHtml(ticket.section || "—"))}
                ${detailRow("Row", escapeHtml(ticket.row || "—"))}
                ${detailRow("Seat", escapeHtml(ticket.seatNumber || ticket.seatLabel || "—"))}`
    : "";
  const customRows = visibleCheckoutAnswers(order, "showInEmail")
    .slice(0, 8)
    .map((a) => detailRow(escapeHtml(a.label), escapeHtml(Array.isArray(a.answer) ? a.answer.join(", ") : a.answer ?? "—")))
    .join("\n");

  const a = branding.accent;
  const border12 = hexToRgba(a, 0.12);
  const border18 = hexToRgba(a, 0.18);
  const border22 = hexToRgba(a, 0.22);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${branding.emailTitle}</title>
  <style type="text/css">${EMAIL_STYLES}</style>
</head>
<body style="margin:0;padding:0;background:${branding.bg};font-family:${branding.fontFamily};color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="background:${branding.bg};padding:24px 12px 40px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="email-card" style="max-width:600px;width:100%;">

          ${isAmsterdamFlamesEvent(event) ? buildAmsterdamFlamesHeaderHtml() : ""}

          <tr>
            <td style="padding:0 4px 18px;border-bottom:1px solid ${border12};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="preheader-row">
                <tr>
                  <td style="font-size:12px;line-height:1.5;color:${branding.mutedText};">Thank you for your purchase!</td>
                  <td align="right" class="preheader-link" style="font-size:12px;line-height:1.5;">
                    <a href="${escapeHtml(viewInBrowserUrl)}" style="color:${a};text-decoration:none;">View in browser</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 4px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="brand-row">
                <tr>
                  <td style="font-size:13px;line-height:1.4;color:#ffffff;font-weight:600;font-family:${branding.headingFontFamily};text-transform:uppercase;">${escapeHtml(branding.brandRowLabel)}</td>
                  <td align="right" class="brand-event" style="font-size:13px;line-height:1.4;color:${branding.bodyText};">${eventTitle}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="hero-pad" style="padding:28px 24px 30px;background:${branding.panelBg};border-radius:18px;border:1px solid ${border18};">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;font-weight:800;color:${a};text-transform:uppercase;">${updateNotice ? "Ticket Update" : "Ticket Confirmation"}</p>
              <h1 class="hero-title" style="margin:0 0 12px;font-size:30px;line-height:1.2;color:#ffffff;font-family:${branding.headingFontFamily};font-weight:700;">${updateNotice ? "Your Ticket Has Been Updated" : "Your Ticket Is Confirmed!"}</h1>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${branding.bodyText};">We are excited to welcome you at <strong style="color:#ffffff;">${eventTitle}</strong>.</p>
              ${updateNotice ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#ffffff;"><strong>Update:</strong> ${escapeHtml(updateNotice)}</p>` : ""}
              ${updateChanges.length ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border-top:1px solid ${hexToRgba(a, 0.2)};">
                ${updateChanges.map((change) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${border12};font-size:13px;line-height:1.5;color:${branding.bodyText};"><strong style="color:${a};">${escapeHtml(change.label)}</strong><br/><span style="color:${branding.mutedText};">${escapeHtml(change.from || "—")}</span> &rarr; <span style="color:#ffffff;">${escapeHtml(change.to || "—")}</span></td></tr>`).join("")}
              </table>` : ""}
              <p style="margin:0;font-size:14px;line-height:1.6;color:${a};font-weight:600;">${tagline}</p>
            </td>
          </tr>

          <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>

          ${hasFinalDayNotice(event) ? buildFinalDayNoticeHtml({ accent: a, bodyText: branding.bodyText, panelBg: branding.panelBg, border: border22 }) : ""}

          <tr>
            <td class="card-pad" style="padding:24px;background:${branding.panelBg};border-radius:18px;border:1px solid ${border22};">
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${a};">Ticket Details</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                ${detailRow("Event", eventTitle)}
                ${detailRow("Date", escapeHtml(formatEventDate(event?.date)))}
                ${detailRow("Time", escapeHtml(formatEventTime(event?.startTime, event?.endTime)))}
                ${detailRow("Venue", venueValue)}
                ${detailRow("Ticket Type", escapeHtml(ticket.ticketTypeName))}
                ${detailRow("Ticket Holder", escapeHtml(ticket.attendeeName))}
                ${seatDetailRows}
                ${customRows}
                ${detailRow("Order ID", escapeHtml(order.orderNumber))}
                ${detailRow("Purchase Date", escapeHtml(formatPurchaseDate(order.createdAt)))}
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
                <tr>
                  <td align="center" style="padding:8px 0 0;">
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:1.4px;font-weight:800;color:${a};text-transform:uppercase;">Your QR Code</p>
                    ${qrCell}
                    <p style="margin:14px auto 0;max-width:280px;font-size:12px;line-height:1.6;color:${branding.mutedText};text-align:center;">Show this QR code at the venue entrance for check-in.</p>
                    <p style="margin:16px auto 0;max-width:320px;font-size:12px;line-height:1.6;color:${branding.bodyText};text-align:center;">Your printable ticket PDF is attached to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>

          ${!isAmsterdamFlamesEvent(event) ? `
          <tr>
            <td class="card-pad" style="padding:22px 24px;background:${branding.panelBg};border-radius:18px;border:1px solid ${border22};">
              <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:${a};">Important Information</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:${branding.bodyText};">
                  <span style="color:${a};font-weight:700;margin-right:8px;">•</span>Please arrive at least 30 minutes before the event starts.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:${branding.bodyText};">
                  <span style="color:${a};font-weight:700;margin-right:8px;">•</span>Tickets are non-refundable and non-transferable unless stated otherwise.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:${branding.bodyText};">
                  <span style="color:${a};font-weight:700;margin-right:8px;">•</span>Keep your QR code secure and do not share it with others.
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;line-height:1.7;color:${branding.bodyText};">
                  <span style="color:${a};font-weight:700;margin-right:8px;">•</span>For updates, visit our website or follow us on social media.
                </td></tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:18px;font-size:0;line-height:0;">&nbsp;</td></tr>
          ` : ""}

          <tr>
            <td class="card-pad" style="padding:20px 24px;background:${branding.panelBg};border-radius:18px;border:1px solid ${border22};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" class="help-col" style="width:50%;padding-right:12px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:${a};">Need Help?</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${branding.bodyText};">Our support team is here for you.</p>
                  </td>
                  <td valign="top" align="right" class="help-col help-col-right" style="width:50%;padding-left:12px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#ffffff;">
                      <span style="color:${a};margin-right:8px;">✉</span>
                      <a href="mailto:${supportEmail}" style="color:#ffffff;text-decoration:none;">${supportEmail}</a>
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;">
                      <span style="color:${a};margin-right:8px;">🌐</span>
                      <a href="${WEBSITE_URL}" style="color:${a};text-decoration:none;">${websiteLabel}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td align="center" style="padding:0 12px 8px;">
              <p style="margin:0 0 10px;font-size:18px;color:${a};line-height:1;">♥</p>
              <p style="margin:0 0 8px;font-size:18px;line-height:1.4;color:#ffffff;font-weight:700;">${escapeHtml(branding.missionTitle)}</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${branding.mutedText};">${escapeHtml(branding.missionSubtitle)}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#ffffff;font-weight:700;font-family:${branding.headingFontFamily};text-transform:uppercase;">${escapeHtml(branding.footerName)}</p>
              <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${branding.mutedText};">${escapeHtml(branding.footerTagline)}</p>
              <p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:${branding.mutedText};">${escapeHtml(branding.footerCopyright)}</p>
              <p style="margin:0;font-size:12px;line-height:1.6;">
                <a href="${PRIVACY_URL}" style="color:${a};text-decoration:none;">Privacy Policy</a>
                <span style="color:${branding.mutedText};">&nbsp;|&nbsp;</span>
                <a href="${TERMS_URL}" style="color:${a};text-decoration:none;">Terms &amp; Conditions</a>
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

export async function sendTicketConfirmationEmail({
  order,
  ticket,
  event,
  subjectOverride = "",
  updateNotice = "",
  updateChanges = [],
  recipientsOverride = null,
}) {
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
  const html = buildTicketEmailHtml({ order, ticket, event, updateNotice, updateChanges }, { qrCid });
  const text = buildTicketEmailText({ order, ticket, event, updateNotice, updateChanges });
  const eventTitle = event?.title || "V.O.I.C.E. NL Event";
  const recipients = [...new Set((recipientsOverride || [
    ticket.attendeeEmail,
    ...(Array.isArray(ticket.alternateEmails) ? ticket.alternateEmails : []),
  ]).map((email) => String(email || "").trim().toLowerCase()).filter(Boolean))];

  try {
    await transporter.sendMail({
      from: buildFromHeader(event),
      to: recipients,
      subject: subjectOverride || `Your ticket for ${eventTitle} — ${ticket.ticketNumber}`,
      text,
      html,
      attachments,
    });
  } catch (error) {
    console.error(
      `[tickets] confirmation email failed for ${ticket.ticketNumber} → ${recipients.join(", ")}:`,
      error.message
    );
    throw error;
  }

  return { sent: true, recipients };
}

function buildBookingEmailText({ order, tickets, event }) {
  const branding = getEmailBranding(event);
  const venue = [event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—";
  const summaries = tickets.map((ticket, index) => {
    const seat = ticket.seatLabel
      || [ticket.section && `Section ${ticket.section}`, ticket.row && `Row ${ticket.row}`, ticket.seatNumber && `Seat ${ticket.seatNumber}`]
        .filter(Boolean).join(" · ")
      || "General admission";
    return `${index + 1}. ${ticket.ticketNumber}
   Holder: ${ticket.attendeeName || "—"}
   Type: ${ticket.ticketTypeName || "—"}
   Seat: ${seat}`;
  }).join("\n\n");

  return `Your booking for ${event?.title || "V.O.I.C.E. NL Event"} is confirmed.
${hasFinalDayNotice(event) ? buildFinalDayNoticeText() : ""}
Order: ${order.orderNumber}
Tickets: ${tickets.length}
Date: ${formatEventDate(event?.date)}
Time: ${formatEventTime(event?.startTime, event?.endTime)}
Venue: ${venue}

YOUR TICKETS

${summaries}

Each ticket has its own unique QR code. The attached PDF contains one independently scannable ticket per page. Keep every QR code secure and present the correct page for each guest at entry.

Need help? ${env.org.contactEmail || "info@stichtingthevoice.nl"}
${WEBSITE_URL}

${branding.textSignature}`;
}

function buildBookingEmailHtml({ order, tickets, event }, qrCids) {
  const branding = getEmailBranding(event);
  const a = branding.accent;
  const eventTitle = escapeHtml(event?.title || "V.O.I.C.E. NL Event");
  const venue = escapeHtml([event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—");
  const ticketCards = tickets.map((ticket, index) => {
    const seat = ticket.seatLabel
      || [ticket.section && `Section ${ticket.section}`, ticket.row && `Row ${ticket.row}`, ticket.seatNumber && `Seat ${ticket.seatNumber}`]
        .filter(Boolean).join(" · ")
      || "General admission";
    const qr = qrCids[index]
      ? `<img src="cid:${qrCids[index]}" alt="Unique QR code for ${escapeHtml(ticket.ticketNumber)}" width="148" height="148" style="display:block;width:148px;height:148px;margin:0 auto;border:9px solid #fff;border-radius:16px;background:#fff;" />`
      : "";
    return `<tr><td style="padding:0 0 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${branding.cardBg};border:1px solid ${hexToRgba(a, 0.24)};border-radius:18px;">
        <tr>
          <td valign="top" style="padding:20px;">
            <p style="margin:0 0 5px;color:${a};font-size:11px;letter-spacing:1.3px;font-weight:800;text-transform:uppercase;">Ticket ${index + 1} of ${tickets.length}</p>
            <p style="margin:0 0 14px;color:#fff;font-size:18px;font-weight:800;">${escapeHtml(ticket.ticketNumber)}</p>
            <p style="margin:0 0 7px;color:${branding.bodyText};font-size:13px;"><strong style="color:#fff;">Holder:</strong> ${escapeHtml(ticket.attendeeName || "—")}</p>
            <p style="margin:0 0 7px;color:${branding.bodyText};font-size:13px;"><strong style="color:#fff;">Type:</strong> ${escapeHtml(ticket.ticketTypeName || "—")}</p>
            <p style="margin:0;color:${branding.bodyText};font-size:13px;"><strong style="color:#fff;">Admission:</strong> ${escapeHtml(seat)}</p>
          </td>
          <td valign="middle" align="center" style="width:185px;padding:18px 18px 18px 0;">${qr}</td>
        </tr>
      </table>
    </td></tr>`;
  }).join("");

  const heroGradient = branding === AMSTERDAM_FLAMES_EMAIL_BRANDING
    ? `linear-gradient(135deg,${branding.panelBg},#1a0800)`
    : "linear-gradient(135deg,#07192d,#101238)";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${branding.emailTitle}</title><style>
    body{margin:0;background:${branding.bg};font-family:${branding.fontFamily};color:#fff}.shell{padding:28px 12px 40px}
    @media(max-width:600px){.shell{padding:14px 8px 28px}.ticket-cell{display:block!important;width:auto!important}}
  </style></head>
  <body><table role="presentation" width="100%" class="shell" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="600" style="width:100%;max-width:600px" cellspacing="0" cellpadding="0">
      ${isAmsterdamFlamesEvent(event) ? buildAmsterdamFlamesHeaderHtml() : ""}
      <tr><td style="padding:26px;background:${heroGradient};border:1px solid ${hexToRgba(a, 0.25)};border-radius:20px;">
        <p style="margin:0 0 10px;color:${a};font-size:11px;letter-spacing:2px;font-weight:800;text-transform:uppercase;">Booking confirmed</p>
        <h1 style="margin:0 0 12px;color:#fff;font-size:30px;line-height:1.2;font-family:${branding.headingFontFamily};">Your ${tickets.length} ${tickets.length === 1 ? "ticket is" : "tickets are"} ready</h1>
        <p style="margin:0;color:${branding.bodyText};font-size:15px;line-height:1.6;">${eventTitle}</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      ${hasFinalDayNotice(event) ? buildFinalDayNoticeHtml({ accent: a, bodyText: branding.bodyText, panelBg: branding.panelBg, border: hexToRgba(a, 0.2) }) : ""}
      <tr><td style="padding:22px;background:${branding.panelBg};border:1px solid ${hexToRgba(a, 0.2)};border-radius:18px;">
        <p style="margin:0 0 8px;color:#fff;font-size:15px;"><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p style="margin:0 0 8px;color:${branding.bodyText};font-size:14px;">${escapeHtml(formatEventDate(event?.date))} · ${escapeHtml(formatEventTime(event?.startTime, event?.endTime))}</p>
        <p style="margin:0;color:${branding.bodyText};font-size:14px;">${venue}</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      ${ticketCards}
      <tr><td style="padding:20px 22px;background:${branding.panelBg};border:1px solid ${hexToRgba(a, 0.2)};border-radius:18px;">
        <p style="margin:0 0 8px;color:${a};font-size:15px;font-weight:800;">One booking. One attachment. Every ticket included.</p>
        <p style="margin:0;color:${branding.bodyText};font-size:13px;line-height:1.7;">Each QR code is unique. Your attached PDF contains one ticket per page, ready to print, save, or share with the correct guest.</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      <tr><td align="center" style="padding:28px 12px;color:${branding.mutedText};font-size:12px;line-height:1.7;">${escapeHtml(branding.textSignature)}<br>${escapeHtml(env.org.contactEmail || "info@stichtingthevoice.nl")}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendTicketOrderConfirmationEmail({ order, tickets, event }) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    throw new Error("At least one ticket is required for a booking confirmation.");
  }
  if (!isMailerConfigured()) {
    console.log("[tickets] SMTP not configured — skipping booking confirmation for", order.orderNumber);
    return { skipped: true };
  }

  const attachments = [];
  const qrCids = [];
  for (let index = 0; index < tickets.length; index += 1) {
    const ticket = tickets[index];
    if (!ticket.verificationToken) {
      qrCids.push(null);
      continue;
    }
    const cid = `ticketQr${index + 1}`;
    try {
      attachments.push({
        filename: `ticket-${ticket.ticketNumber}-qr.png`,
        content: await generateTicketQrPngBuffer(ticket.verificationToken),
        cid,
        contentDisposition: "inline",
      });
      qrCids.push(cid);
    } catch (error) {
      console.warn(`[tickets] Could not generate QR for ${ticket.ticketNumber}:`, error.message);
      qrCids.push(null);
    }
  }

  const pdfBuffer = await generateOrderTicketsPdfFromDocs(tickets, order, event);
  attachments.push({
    filename: `booking-${order.orderNumber}-tickets.pdf`,
    content: pdfBuffer,
    contentType: "application/pdf",
    contentDisposition: "attachment",
  });

  // A booking confirmation belongs to the purchaser. Do not expose companion
  // or alternate addresses to one another in a consolidated `to` header.
  const purchaserEmail = String(order.attendeeEmail || tickets[0]?.attendeeEmail || "")
    .trim()
    .toLowerCase();
  const recipients = purchaserEmail ? [purchaserEmail] : [];
  if (!recipients.length) {
    throw new Error(`Booking ${order.orderNumber} has no confirmation email recipient.`);
  }

  await getSmtpTransporter().sendMail({
    from: buildFromHeader(event),
    to: recipients,
    subject: `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"} for ${event?.title || "V.O.I.C.E. NL Event"} — ${order.orderNumber}`,
    text: buildBookingEmailText({ order, tickets, event }),
    html: buildBookingEmailHtml({ order, tickets, event }, qrCids),
    attachments,
  });

  return { sent: true, recipients, ticketCount: tickets.length };
}

export function sendTicketUpdateEmail({ order, ticket, event, reason, changes = [], recipients, subject }) {
  return sendTicketConfirmationEmail({
    order,
    ticket,
    event,
    updateNotice: reason || "Administrative details were modified.",
    updateChanges: changes,
    recipientsOverride: recipients,
    subjectOverride: subject || `Updated ticket for ${event?.title || "V.O.I.C.E. NL Event"} — ${ticket.ticketNumber}`,
  });
}

export { buildTicketEmailHtml };
