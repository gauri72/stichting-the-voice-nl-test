import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";
import { collectPdfBuffer as collectDoc } from "../utils/pdfBuffer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");
const AF_LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "public", "amsterdam-flames", "af-crest-orange.png");
// Full crest + "Amsterdam Flames" wordmark, cropped directly from amsterdamflames.com
// (transparent background, white/orange text) — used as-is for the VIP pass instead of
// the Helvetica-approximated wordmark drawHeaderLogo() draws for regular tickets, since
// the pass calls for the club's real logo. Its white text needs a dark backdrop, so
// renderVipPassPdf places it directly on the card body rather than a light banner.
const AF_LOGO_WORDMARK_PATH = path.join(__dirname, "..", "..", "..", "client", "public", "amsterdam-flames", "logo-wordmark.png");

// Amsterdam Flames is a partner-branded event: its tickets render in the
// club's own dark/flame-orange identity with no V.O.I.C.E. NL branding.
const AMSTERDAM_FLAMES_EVENT_SLUG = "amsterdam-flames-night-of-the-stars";

const DEFAULT_COLORS = {
  navy: "#06152f",
  headerBand: "#0b2447",
  teal: "#0a8a98",
  cyan: "#3ecf9a",
  muted: "#8a9bb5",
  white: "#ffffff",
  pink: "#d1007f",
};

const AF_COLORS = {
  navy: "#171717",
  headerBand: "#0f0f0f",
  teal: "#f05e3c",
  cyan: "#f05e3c",
  muted: "#7a7a7a",
  white: "#ffffff",
  pink: "#f05e3c",
};

// Hardcoded so the VIP Pass always renders Amsterdam Flames' theme/copy regardless of
// whether an admin has filled in Event.vipPassTheme — the generic per-event theme panel
// remains available (and still overrides these), but AF's own pass is guaranteed.
const AF_VIP_WELCOME_MESSAGE =
  "Welcome to Amsterdam Flames: Night Of Stars — we are thrilled to have you as our VIP guest tonight.";

// `override` (from Event.vipPassTheme, VIP passes only — see renderVipPassPdf) lets an
// admin-configured color pair win over the hardcoded per-slug palette below. Regular
// ticket rendering never passes an override, so its existing AF/default behavior is
// unaffected.
export function getPdfColors(eventSlug, override = null) {
  if (override?.primaryColor && override?.backgroundColor) {
    return {
      ...DEFAULT_COLORS,
      teal: override.primaryColor,
      cyan: override.primaryColor,
      pink: override.primaryColor,
      navy: override.backgroundColor,
      headerBand: override.backgroundColor,
    };
  }
  return eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG ? AF_COLORS : DEFAULT_COLORS;
}

// `logoDataUrl` (from Event.vipPassTheme.logoUrl) lets an admin-uploaded logo win over
// the hardcoded per-slug logo file below. pdfkit's doc.image() accepts a data: URI
// directly, so no decoding is needed here.
export function getLogo(eventSlug, logoDataUrl = "") {
  if (logoDataUrl) return { path: null, dataUrl: logoDataUrl, fallbackText: "" };
  if (eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG) {
    return { path: AF_LOGO_PATH, fallbackText: "AMSTERDAM FLAMES" };
  }
  return { path: LOGO_PATH, fallbackText: "V.O.I.C.E. NL" };
}

export function getFooterCopyright(eventSlug) {
  return eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG
    ? "© 2026 Amsterdam Flames. All rights reserved."
    : "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.";
}

const PAGE_MARGIN = 40;

// Matches the crest + "Amsterdam Flames" wordmark used in the header on both
// the event pages and the confirmation emails — same crest image, plus the
// white/orange wordmark text next to it (Helvetica-Bold stands in for the
// site's Archivo Black, since embedding that font file is unavailable here).
export function drawHeaderLogo(doc, values, colors, logo) {
  if (logo.dataUrl) {
    doc.image(logo.dataUrl, PAGE_MARGIN, 24, { height: 52 });
    return;
  }
  if (!fs.existsSync(logo.path)) {
    doc.font("Helvetica-Bold").fontSize(18).fillColor(colors.white).text(logo.fallbackText, PAGE_MARGIN, 40);
    return;
  }
  doc.image(logo.path, PAGE_MARGIN, 24, { height: 52 });
  if (values.event_slug === AMSTERDAM_FLAMES_EVENT_SLUG) {
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(colors.white)
      .text("AMSTERDAM ", PAGE_MARGIN + 50, 40, { continued: true })
      .fillColor(colors.teal)
      .text("FLAMES");
  }
}

// Shared by renderTicketPdf and renderVipPassPdf — advances by each value's actual
// rendered height (not a fixed step) so a value that wraps to two lines (e.g. a long
// venue address) doesn't run into the next row's label.
export function drawDetailRows(doc, colors, rows, x, y, width) {
  let rowY = y;
  for (const [label, value] of rows) {
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text(label.toUpperCase(), x, rowY);
    doc.font("Helvetica-Bold").fontSize(12);
    const valueHeight = doc.heightOfString(value, { width });
    doc.fillColor(colors.navy).text(value, x, rowY + 12, { width });
    rowY += 12 + valueHeight + 12;
  }
  return rowY;
}

/**
 * @param {Record<string, string>} values
 * @returns {Promise<Buffer>}
 */
export async function renderTicketPdf(values) {
  const colors = getPdfColors(values.event_slug);
  const logo = getLogo(values.event_slug);
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const promise = collectDoc(doc);

  let qrBuffer = null;
  if (values.verification_token) {
    try {
      qrBuffer = await generateTicketQrPngBuffer(values.verification_token);
    } catch {
      qrBuffer = null;
    }
  }

  const bandHeight = 100;
  doc.rect(0, 0, 595.28, bandHeight).fill(colors.headerBand);

  drawHeaderLogo(doc, values, colors, logo);

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(colors.white)
    .text("Event Ticket", PAGE_MARGIN, bandHeight + 28, { width: 515 });

  const y = bandHeight + 70;
  const colW = 240;

  const rows = [
    ["Event", values.event_name || "—"],
    ["Ticket holder", values.attendee_name || "—"],
    ["Ticket type", values.ticket_type || "—"],
    ["Primary email", values.attendee_email || "—"],
    ["Date", values.event_date || "—"],
    ["Time", values.event_time || "—"],
    ["Venue", values.venue || "—"],
    ["Order ID", values.order_number || "—"],
    ["Ticket ID", values.ticket_number || "—"],
  ];
  if (values.alternate_emails) rows.push(["Alternate emails", values.alternate_emails]);
  if (values.partner_details) rows.push(["Partner / companion", values.partner_details]);
  if (values.ticket_status && values.ticket_status !== "valid") {
    rows.push(["Ticket status", values.ticket_status.toUpperCase()]);
  }
  if (values.void_reason) rows.push(["Void reason", values.void_reason]);

  if (values.seat_row || values.seat_number) {
    rows.splice(3, 0, ["Seat", values.seat_display || "—"]);
    if (values.seat_section) rows.splice(3, 0, ["Section", values.seat_section]);
  }
  if (values.custom_answers) {
    rows.push(["Checkout Info", values.custom_answers]);
  }

  drawDetailRows(doc, colors, rows, PAGE_MARGIN, y, colW);

  if (qrBuffer) {
    doc.image(qrBuffer, 380, y, { width: 140, height: 140 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(colors.muted)
      .text("Scan at entry", 380, y + 148, { width: 140, align: "center" });
  }

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(
      "Present this ticket (printed or on your phone) at the venue entrance.",
      PAGE_MARGIN,
      720,
      { width: 515, align: "center" }
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(colors.muted)
    .text(getFooterCopyright(values.event_slug), PAGE_MARGIN, 750, {
      width: 515,
      align: "center",
    });

  doc.end();
  return promise;
}

export function formatTicketPdfEventDate(date) {
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

/** Build PDF field map from persisted ticket / order / event documents. */
export function buildTicketPdfValuesFromDocs(ticket, order, event) {
  const hasSeat = Boolean(ticket?.row || ticket?.seatNumber || ticket?.seatLabel);
  const seatDisplay = ticket?.seatLabel
    || (ticket?.row && ticket?.seatNumber ? `Row ${ticket.row} · Seat ${ticket.seatNumber}` : "");

  const custom = (order?.checkoutAnswers || [])
    .filter((a) => a?.visibility?.showInPdf)
    .slice(0, 6)
    .map((a) => `${a.questionLabel}: ${Array.isArray(a.answer) ? a.answer.join(", ") : a.answer ?? "—"}`)
    .join(" | ");

  return {
    verification_token: ticket?.verificationToken || "",
    event_slug: event?.slug || "",
    event_name: event?.title || "—",
    attendee_name: ticket?.attendeeName || "—",
    attendee_email: ticket?.attendeeEmail || "—",
    alternate_emails: (ticket?.alternateEmails || []).join(", "),
    partner_details: ticket?.partnerDetails
      ? [
          ticket.partnerDetails.name,
          ticket.partnerDetails.email,
          ticket.partnerDetails.phone,
          ticket.partnerDetails.relationship,
        ].filter(Boolean).join(" · ")
      : "",
    ticket_status: ticket?.status || "valid",
    void_reason: ticket?.voidReason || "",
    ticket_type: ticket?.ticketTypeName || "—",
    event_date: formatTicketPdfEventDate(event?.date),
    event_time: event?.startTime || "—",
    venue: [event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—",
    order_number: order?.orderNumber || "—",
    ticket_number: ticket?.ticketNumber || "—",
    seat_section: hasSeat ? ticket?.section || "" : "",
    seat_row: hasSeat ? ticket?.row || "" : "",
    seat_number: hasSeat ? ticket?.seatNumber || "" : "",
    seat_display: seatDisplay,
    custom_answers: custom,
  };
}

export async function generateTicketPdfFromDocs(ticket, order, event) {
  return renderTicketPdf(buildTicketPdfValuesFromDocs(ticket, order, event));
}

/** Build PDF field map for a VIP Pass — a welcome pass, not a purchase record, so it
 *  carries none of the order/ticket-type/seat rows a regular ticket does. */
export function buildVipPassPdfValuesFromDocs(ticket, order, event) {
  const theme = event?.vipPassTheme || {};
  return {
    verification_token: ticket?.verificationToken || "",
    event_slug: event?.slug || "",
    event_name: event?.title || "—",
    guest_name: ticket?.attendeeName || "Guest",
    event_date: formatTicketPdfEventDate(event?.date),
    event_time: [event?.startTime, event?.endTime].filter(Boolean).join(" – ") || "—",
    venue: [event?.venueName, event?.venueAddress].filter(Boolean).join(", ") || "—",
    welcome_message:
      theme.welcomeMessage ||
      (event?.slug === AMSTERDAM_FLAMES_EVENT_SLUG ? AF_VIP_WELCOME_MESSAGE : ""),
    primary_color: theme.primaryColor || "",
    background_color: theme.backgroundColor || "",
    logo_data_url: theme.logoUrl || "",
    ticket_number: ticket?.ticketNumber || "—",
  };
}

/**
 * @param {Record<string, string>} values
 * @returns {Promise<Buffer>}
 */
// Landscape "pass card" — deliberately not the document-style layout renderTicketPdf
// uses. A bordered card, full-bleed: a white logo banner across the top, a rounded
// "VIP PASS" badge, the guest's name large, a short description, and a dedicated white
// QR panel on the right — modeled on a real premium VIP-pass reference design, with the
// event's own theme colors standing in for that reference's gold/navy.
export async function renderVipPassPdf(values) {
  const colors = getPdfColors(values.event_slug, {
    primaryColor: values.primary_color,
    backgroundColor: values.background_color,
  });
  const logo = getLogo(values.event_slug, values.logo_data_url);

  const PAGE_W = 720;
  const PAGE_H = 340;
  const BORDER = 14;
  const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0 });
  const promise = collectDoc(doc);

  let qrBuffer = null;
  if (values.verification_token) {
    try {
      qrBuffer = await generateTicketQrPngBuffer(values.verification_token);
    } catch {
      qrBuffer = null;
    }
  }

  // Outer accent-colored border frame, with the card body inset inside it.
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(colors.teal);
  doc.rect(BORDER, BORDER, PAGE_W - BORDER * 2, PAGE_H - BORDER * 2).fill(colors.navy);

  // AF's real crest+wordmark (cropped from amsterdamflames.com) has white/orange text
  // on a transparent background, so it goes straight on the dark card — a light banner
  // would make its white text disappear. Everything else (a custom admin-uploaded logo,
  // or the generic fallback) keeps the light banner, since most such logos assume one.
  const useAfWordmark = values.event_slug === AMSTERDAM_FLAMES_EVENT_SLUG && !logo.dataUrl && fs.existsSync(AF_LOGO_WORDMARK_PATH);
  let headerBottom;
  if (useAfWordmark) {
    const wmHeight = 32;
    const wmY = BORDER + 22;
    doc.image(AF_LOGO_WORDMARK_PATH, BORDER + 30, wmY, { height: wmHeight });
    headerBottom = wmY + wmHeight;
  } else {
    const bannerHeight = 60;
    doc.rect(BORDER, BORDER, PAGE_W - BORDER * 2, bannerHeight).fill("#ffffff");
    const logoX = BORDER + 22;
    const logoInnerHeight = bannerHeight - 24;
    const logoY = BORDER + (bannerHeight - logoInnerHeight) / 2;
    if (logo.dataUrl) {
      doc.image(logo.dataUrl, logoX, logoY, { height: logoInnerHeight });
    } else if (logo.path && fs.existsSync(logo.path)) {
      doc.image(logo.path, logoX, logoY, { height: logoInnerHeight });
      if (values.event_slug === AMSTERDAM_FLAMES_EVENT_SLUG) {
        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor("#171717")
          .text("AMSTERDAM ", logoX + logoInnerHeight + 12, BORDER + bannerHeight / 2 - 7, { continued: true })
          .fillColor(colors.teal)
          .text("FLAMES");
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(17).fillColor("#171717").text(logo.fallbackText || values.event_name || "", logoX, BORDER + bannerHeight / 2 - 8);
    }
    headerBottom = BORDER + bannerHeight;
  }

  const qrPanelW = 190;
  const contentX = BORDER + 36;
  const contentWidth = PAGE_W - BORDER * 2 - qrPanelW - 36 - 30;
  let y = headerBottom + 24;

  // "VIP PASS" badge.
  const pillW = 108;
  const pillH = 25;
  doc.roundedRect(contentX, y, pillW, pillH, pillH / 2).fill(colors.teal);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.navy).text("VIP PASS", contentX, y + 7, { width: pillW, align: "center" });
  y += pillH + 18;

  // Guest name.
  doc.font("Helvetica-Bold").fontSize(27).fillColor(colors.white);
  const nameHeight = doc.heightOfString(values.guest_name || "Guest", { width: contentWidth });
  doc.text(values.guest_name || "Guest", contentX, y, { width: contentWidth });
  y += nameHeight + 14;

  // Description — a custom welcome message if the event has one configured, else a
  // sensible default naming the event.
  const description = values.welcome_message
    || `Grants complimentary entry to ${values.event_name || "the event"}.`;
  doc.font("Helvetica").fontSize(11).fillColor(colors.muted);
  const descHeight = doc.heightOfString(description, { width: contentWidth, lineGap: 3 });
  doc.text(description, contentX, y, { width: contentWidth, lineGap: 3 });
  y += descHeight + 8;

  const detailsLine = [values.event_date, values.event_time, values.venue].filter(Boolean).join(" · ");
  if (detailsLine) {
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text(detailsLine, contentX, y, { width: contentWidth });
  }

  // Footer divider + instruction, anchored to the bottom of the card.
  const footerY = PAGE_H - BORDER - 32;
  doc.moveTo(contentX, footerY).lineTo(contentX + contentWidth, footerY).lineWidth(0.5).strokeColor(colors.muted).stroke();
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(colors.muted)
    .text("Present this pass (screen or print) for scanning at the entrance.", contentX, footerY + 10, { width: contentWidth });

  // White QR panel on the right.
  const qrPanelX = PAGE_W - BORDER - 20 - qrPanelW;
  const qrPanelY = headerBottom + 20;
  const qrPanelH = PAGE_H - BORDER - qrPanelY - 20;
  doc.roundedRect(qrPanelX, qrPanelY, qrPanelW, qrPanelH, 14).fill("#ffffff");
  if (qrBuffer) {
    const qrSize = Math.min(qrPanelW, qrPanelH) - 50;
    doc.image(qrBuffer, qrPanelX + (qrPanelW - qrSize) / 2, qrPanelY + 16, { width: qrSize, height: qrSize });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(colors.teal)
      .text("VIP GUEST", qrPanelX, qrPanelY + qrPanelH - 26, { width: qrPanelW, align: "center" });
  }

  doc.end();
  return promise;
}

async function drawBookingTicketPage(doc, values, pageNumber, totalPages) {
  const colors = getPdfColors(values.event_slug);
  const logo = getLogo(values.event_slug);
  let qrBuffer = null;
  if (values.verification_token) {
    try {
      qrBuffer = await generateTicketQrPngBuffer(values.verification_token);
    } catch {
      qrBuffer = null;
    }
  }

  doc.rect(0, 0, 595.28, 100).fill(colors.headerBand);
  drawHeaderLogo(doc, values, colors, logo);
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(colors.white)
    .text(`Event Ticket ${pageNumber} of ${totalPages}`, PAGE_MARGIN, 128, { width: 515 });

  const rows = [
    ["Event", values.event_name || "—"],
    ["Ticket holder", values.attendee_name || "—"],
    ["Primary email", values.attendee_email || "—"],
    ["Ticket type", values.ticket_type || "—"],
    ["Date", values.event_date || "—"],
    ["Time", values.event_time || "—"],
    ["Venue", values.venue || "—"],
    ["Order ID", values.order_number || "—"],
    ["Ticket ID", values.ticket_number || "—"],
  ];
  if (values.seat_section) rows.push(["Section", values.seat_section]);
  if (values.seat_display) rows.push(["Seat", values.seat_display]);
  if (values.alternate_emails) rows.push(["Alternate emails", values.alternate_emails]);
  if (values.partner_details) rows.push(["Partner / companion", values.partner_details]);
  if (values.ticket_status && values.ticket_status !== "valid") rows.push(["Ticket status", values.ticket_status.toUpperCase()]);
  if (values.void_reason) rows.push(["Void reason", values.void_reason]);

  let rowY = 178;
  for (const [label, value] of rows) {
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(label.toUpperCase(), PAGE_MARGIN, rowY);
    doc.font("Helvetica-Bold").fontSize(11);
    // Advance by the value's actual rendered height, not a fixed step — a
    // two-line value (e.g. a long venue address) would otherwise run into
    // the next row's label.
    const valueHeight = doc.heightOfString(value, { width: 285 });
    doc.fillColor(colors.navy).text(value, PAGE_MARGIN, rowY + 11, { width: 285 });
    rowY += 11 + valueHeight + 11;
  }

  if (qrBuffer) {
    doc.image(qrBuffer, 370, 185, { width: 150, height: 150 });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.teal).text(values.ticket_number || "", 370, 344, {
      width: 150,
      align: "center",
    });
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("Present this unique QR code at entry", 360, 362, {
      width: 170,
      align: "center",
    });
  }

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(colors.muted)
    .text("Each page is a separate admission ticket. Do not share its QR code.", PAGE_MARGIN, 720, {
      width: 515,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(colors.muted)
    .text(`${getFooterCopyright(values.event_slug)} · Page ${pageNumber} of ${totalPages}`, PAGE_MARGIN, 750, {
      width: 515,
      align: "center",
    });
}

/** Generate one booking PDF containing one independently scannable ticket per page. */
export async function generateOrderTicketsPdfFromDocs(tickets, order, event) {
  const values = (tickets || []).map((ticket) => buildTicketPdfValuesFromDocs(ticket, order, event));
  if (!values.length) {
    const err = new Error("At least one ticket is required to generate a booking PDF.");
    err.status = 400;
    throw err;
  }
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, autoFirstPage: false });
  const promise = collectDoc(doc);
  for (let index = 0; index < values.length; index += 1) {
    doc.addPage();
    await drawBookingTicketPage(doc, values[index], index + 1, values.length);
  }
  doc.end();
  return promise;
}
