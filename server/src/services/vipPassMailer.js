import { getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";
import { renderVipPassPdf, buildVipPassPdfValuesFromDocs } from "./ticketPdfService.js";
import { getEmailBranding, buildFromHeader, hexToRgba } from "./ticketMailer.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export { isMailerConfigured };

// Amsterdam Flames is a partner-branded event — its VIP pass copy is hardcoded so the
// email matches the PDF regardless of whether the generic per-event theme panel has been
// filled in. Kept as its own local constant, same pattern as ticketPdfService.js/
// ticketMailer.js each redefining AMSTERDAM_FLAMES_EVENT_SLUG locally.
const AMSTERDAM_FLAMES_EVENT_SLUG = "amsterdam-flames-night-of-the-stars";
const AF_VIP_WELCOME_MESSAGE =
  "Welcome to Amsterdam Flames: Night Of Stars — we are thrilled to have you as our VIP guest tonight.";

function vipWelcomeMessage(event) {
  return (
    event?.vipPassTheme?.welcomeMessage ||
    (event?.slug === AMSTERDAM_FLAMES_EVENT_SLUG
      ? AF_VIP_WELCOME_MESSAGE
      : `You are our honored guest at ${event?.title || "this event"}. We're delighted to have you join us.`)
  );
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

// Layers an event's admin-configured VIP pass colors (Event.vipPassTheme) on top of the
// existing default/Amsterdam-Flames email branding, rather than replacing it outright —
// an event with no VIP theme configured still gets a fully-branded email.
function getVipEmailBranding(event) {
  const base = getEmailBranding(event);
  const theme = event?.vipPassTheme || {};
  if (!theme.primaryColor && !theme.backgroundColor) return base;
  return {
    ...base,
    accent: theme.primaryColor || base.accent,
    bg: theme.backgroundColor || base.bg,
    panelBg: theme.backgroundColor || base.panelBg,
    cardBg: theme.backgroundColor || base.cardBg,
  };
}

function buildVipPassEmailText({ order, ticket, event }) {
  const branding = getVipEmailBranding(event);
  const venue = [event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—";
  const welcome = vipWelcomeMessage(event);

  return `You're on the list!

Welcome, ${ticket.attendeeName || "Guest"}.

${welcome}

${event?.title || "Event"}
${formatEventDate(event?.date)}${event?.startTime ? ` · ${event.startTime}` : ""}
${venue}

Your VIP Pass PDF is attached — present it (printed or on your phone) at the venue entrance.

${branding.textSignature}`;
}

function buildVipPassEmailHtml({ order, ticket, event }, { qrCid }) {
  const branding = getVipEmailBranding(event);
  const a = branding.accent;
  const eventTitle = escapeHtml(event?.title || "Event");
  const venue = escapeHtml([event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—");
  const guestName = escapeHtml(ticket.attendeeName || "Guest");
  const welcome = escapeHtml(vipWelcomeMessage(event));
  const qr = qrCid
    ? `<img src="cid:${qrCid}" alt="VIP Pass QR code" width="160" height="160" style="display:block;width:160px;height:160px;margin:0 auto;border:9px solid #fff;border-radius:16px;background:#fff;" />`
    : "";

  const heroGradient = `linear-gradient(135deg,${branding.panelBg},${hexToRgba(a, 0.15)})`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your VIP Pass — ${eventTitle}</title><style>
    body{margin:0;background:${branding.bg};font-family:${branding.fontFamily};color:#fff}.shell{padding:28px 12px 40px}
    @media(max-width:600px){.shell{padding:14px 8px 28px}}
  </style></head>
  <body><table role="presentation" width="100%" class="shell" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="600" style="width:100%;max-width:600px" cellspacing="0" cellpadding="0">
      <tr><td style="padding:26px;background:${heroGradient};border:1px solid ${hexToRgba(a, 0.25)};border-radius:20px;">
        <p style="margin:0 0 10px;color:${a};font-size:11px;letter-spacing:2px;font-weight:800;text-transform:uppercase;">You're on the list</p>
        <h1 style="margin:0 0 12px;color:#fff;font-size:28px;line-height:1.2;font-family:${branding.headingFontFamily};">Welcome, ${guestName}</h1>
        <p style="margin:0;color:${branding.bodyText};font-size:15px;line-height:1.6;">${welcome}</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      <tr><td style="padding:22px;background:${branding.panelBg};border:1px solid ${hexToRgba(a, 0.2)};border-radius:18px;">
        <p style="margin:0 0 8px;color:#fff;font-size:17px;font-weight:800;">${eventTitle}</p>
        <p style="margin:0 0 8px;color:${branding.bodyText};font-size:14px;">${escapeHtml(formatEventDate(event?.date))}${event?.startTime ? ` · ${escapeHtml(event.startTime)}` : ""}</p>
        <p style="margin:0;color:${branding.bodyText};font-size:14px;">${venue}</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      <tr><td align="center" style="padding:24px;background:${branding.cardBg};border:1px solid ${hexToRgba(a, 0.24)};border-radius:18px;">
        ${qr}
        <p style="margin:14px 0 0;color:${branding.mutedText};font-size:12px;">Scan at entry</p>
      </td></tr>
      <tr><td style="height:18px">&nbsp;</td></tr>
      <tr><td style="padding:18px 22px;background:${branding.panelBg};border:1px solid ${hexToRgba(a, 0.2)};border-radius:18px;">
        <p style="margin:0;color:${branding.bodyText};font-size:13px;line-height:1.7;">Your VIP Pass PDF is attached — present it (printed or on your phone) at the venue entrance.</p>
      </td></tr>
      <tr><td style="height:22px">&nbsp;</td></tr>
      <tr><td align="center" style="padding:6px 10px;">
        <p style="margin:0;color:${branding.mutedText};font-size:11px;">${escapeHtml(branding.footerCopyright)}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendVipPassEmail({ order, ticket, event }) {
  if (!isMailerConfigured()) {
    console.log("[vip-pass] SMTP not configured — skipping VIP pass email for", ticket.ticketNumber);
    return { skipped: true };
  }

  const transporter = getSmtpTransporter();
  const attachments = [];

  if (ticket.verificationToken) {
    try {
      attachments.push({
        filename: "vip-pass-qr.png",
        content: await generateTicketQrPngBuffer(ticket.verificationToken),
        cid: "vipPassQr",
        contentDisposition: "inline",
      });
    } catch (error) {
      console.warn("[vip-pass] Could not generate QR for email:", error.message);
    }
  }

  try {
    const pdfBuffer = await renderVipPassPdf(buildVipPassPdfValuesFromDocs(ticket, order, event));
    attachments.push({
      filename: `vip-pass-${ticket.ticketNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
      contentDisposition: "attachment",
    });
  } catch (error) {
    console.warn("[vip-pass] Could not generate PDF for email:", error.message);
  }

  const qrCid = attachments.find((a) => a.cid)?.cid || null;
  const html = buildVipPassEmailHtml({ order, ticket, event }, { qrCid });
  const text = buildVipPassEmailText({ order, ticket, event });
  const eventTitle = event?.title || "the event";

  await transporter.sendMail({
    from: buildFromHeader(event),
    to: [ticket.attendeeEmail],
    subject: `Your VIP Pass for ${eventTitle}`,
    text,
    html,
    attachments,
  });

  return { sent: true, recipients: [ticket.attendeeEmail] };
}
