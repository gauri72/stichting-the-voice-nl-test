import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";
import { collectPdfBuffer as collectDoc } from "../utils/pdfBuffer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");
const AF_LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "public", "amsterdam-flames", "af-crest-orange.png");

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

function getPdfColors(eventSlug) {
  return eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG ? AF_COLORS : DEFAULT_COLORS;
}

function getLogo(eventSlug) {
  if (eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG) {
    return { path: AF_LOGO_PATH, fallbackText: "AMSTERDAM FLAMES" };
  }
  return { path: LOGO_PATH, fallbackText: "V.O.I.C.E. NL" };
}

function getFooterCopyright(eventSlug) {
  return eventSlug === AMSTERDAM_FLAMES_EVENT_SLUG
    ? "© 2026 Amsterdam Flames. All rights reserved."
    : "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.";
}

const PAGE_MARGIN = 40;

// Matches the crest + "Amsterdam Flames" wordmark used in the header on both
// the event pages and the confirmation emails — same crest image, plus the
// white/orange wordmark text next to it (Helvetica-Bold stands in for the
// site's Archivo Black, since embedding that font file is unavailable here).
function drawHeaderLogo(doc, values, colors, logo) {
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

  let rowY = y;
  for (const [label, value] of rows) {
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted).text(label.toUpperCase(), PAGE_MARGIN, rowY);
    doc.font("Helvetica-Bold").fontSize(12);
    // Rows advance by the value's actual rendered height (not a fixed step) so a
    // value that wraps to two lines — e.g. a long venue address — doesn't run
    // into the next row's label instead of just the usual one-line gap.
    const valueHeight = doc.heightOfString(value, { width: colW });
    doc.fillColor(colors.navy).text(value, PAGE_MARGIN, rowY + 12, { width: colW });
    rowY += 12 + valueHeight + 12;
  }

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

function formatTicketPdfEventDate(date) {
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
