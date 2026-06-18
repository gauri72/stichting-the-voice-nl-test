import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");

const COLORS = {
  navy: "#06152f",
  headerBand: "#0b2447",
  teal: "#0a8a98",
  cyan: "#3ecf9a",
  muted: "#8a9bb5",
  white: "#ffffff",
  pink: "#d1007f",
};

const PAGE_MARGIN = 40;

function collectDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/**
 * @param {Record<string, string>} values
 * @returns {Promise<Buffer>}
 */
export async function renderTicketPdf(values) {
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
  doc.rect(0, 0, 595.28, bandHeight).fill(COLORS.headerBand);

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, PAGE_MARGIN, 24, { height: 52 });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(COLORS.white)
      .text("V.O.I.C.E. NL", PAGE_MARGIN, 40);
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.white)
    .text("Event Ticket", PAGE_MARGIN, bandHeight + 28, { width: 515 });

  const y = bandHeight + 70;
  const colW = 240;

  const rows = [
    ["Event", values.event_name || "—"],
    ["Ticket holder", values.attendee_name || "—"],
    ["Ticket type", values.ticket_type || "—"],
    ["Date", values.event_date || "—"],
    ["Time", values.event_time || "—"],
    ["Venue", values.venue || "—"],
    ["Order ID", values.order_number || "—"],
    ["Ticket ID", values.ticket_number || "—"],
  ];

  let rowY = y;
  for (const [label, value] of rows) {
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text(label.toUpperCase(), PAGE_MARGIN, rowY);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.navy)
      .text(value, PAGE_MARGIN, rowY + 12, { width: colW });
    rowY += 38;
  }

  if (qrBuffer) {
    doc.image(qrBuffer, 380, y, { width: 140, height: 140 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("Scan at entry", 380, y + 148, { width: 140, align: "center" });
  }

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "Present this ticket (printed or on your phone) at the venue entrance.",
      PAGE_MARGIN,
      720,
      { width: 515, align: "center" }
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text("© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.", PAGE_MARGIN, 750, {
      width: 515,
      align: "center",
    });

  doc.end();
  return promise;
}
