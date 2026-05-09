import PDFDocument from "pdfkit";
import { SPONSORSHIP_COVERAGE } from "../config/sponsorshipCoverage.js";

// Brand palette - kept in sync with the client templates supplied by Stichting
// The V.O.I.C.E. NL.
const COLORS = {
  text: "#17314b",
  muted: "#5d6e7f",
  rule: "#d9e1e8",
  tableHeader: "#1f3b5a",
  tableHeaderText: "#ffffff",
  accent: "#1f9f78",
  accentBg: "#eaf6f0",
  brandTeal: "#1b7d8f"
};

const FONTS = {
  body: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique"
};

function drawHeader(doc, options) {
  const { contactEmail, orgTagline } = options;
  const top = doc.page.margins.top;

  // Wordmark (text-only; no external image required)
  doc
    .fillColor(COLORS.brandTeal)
    .font(FONTS.bold)
    .fontSize(11)
    .text("STICHTING ", doc.page.margins.left, top, { continued: true })
    .fillColor(COLORS.text)
    .text("THE V.O.I.C.E. NL", { continued: false });

  doc
    .fillColor(COLORS.muted)
    .font(FONTS.body)
    .fontSize(8.5)
    .text(orgTagline, doc.page.margins.left, top + 14, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 180
    });

  if (contactEmail) {
    doc.text(contactEmail, doc.page.margins.left, top + 26);
  }

  doc
    .moveTo(doc.page.margins.left, top + 44)
    .lineTo(doc.page.width - doc.page.margins.right, top + 44)
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .stroke();

  doc.moveDown(2);
  doc.y = top + 56;
}

function drawTitle(doc, title, subtitle) {
  doc
    .fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(20)
    .text(title, { align: "left" });

  if (subtitle) {
    doc
      .moveDown(0.2)
      .font(FONTS.body)
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(subtitle);
  }
  doc.moveDown(0.6);
}

function drawSectionHeading(doc, text) {
  doc
    .moveDown(0.6)
    .fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(13)
    .text(text);
  doc.moveDown(0.3);
}

function drawInfoTable(doc, rows) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const labelWidth = 170;
  const valueWidth = width - labelWidth;
  const rowPadding = 7;

  // Header bar
  const headerHeight = 22;
  doc
    .rect(left, doc.y, width, headerHeight)
    .fill(COLORS.tableHeader);
  doc
    .fillColor(COLORS.tableHeaderText)
    .font(FONTS.bold)
    .fontSize(11)
    .text("Sponsorship Receipt", left + 12, doc.y + 6, { width: width - 24 });

  doc.y += headerHeight;

  rows.forEach((row, idx) => {
    const startY = doc.y;
    doc
      .fillColor(COLORS.text)
      .font(FONTS.bold)
      .fontSize(10)
      .text(row.label, left + 12, startY + rowPadding, {
        width: labelWidth - 16
      });

    doc
      .font(FONTS.body)
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(row.value || "-", left + labelWidth, startY + rowPadding, {
        width: valueWidth - 12
      });

    const endY = Math.max(doc.y, startY + 22);
    const rowHeight = endY - startY + rowPadding;

    doc
      .moveTo(left, startY + rowHeight)
      .lineTo(left + width, startY + rowHeight)
      .lineWidth(0.5)
      .strokeColor(COLORS.rule)
      .stroke();

    if (idx === 0) {
      doc
        .moveTo(left, startY)
        .lineTo(left + width, startY)
        .stroke();
    }

    doc.y = startY + rowHeight;
  });
}

function ensureSpace(doc, needed) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

function drawCoverageTable(doc) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const tierW = 110;
  const amountW = 70;
  const coverageW = width - tierW - amountW;

  ensureSpace(doc, 80);

  // Header
  const headerH = 22;
  doc
    .rect(left, doc.y, width, headerH)
    .fill(COLORS.tableHeader);
  doc
    .fillColor(COLORS.tableHeaderText)
    .font(FONTS.bold)
    .fontSize(10);
  doc.text("Tier", left + 10, doc.y + 6, { width: tierW - 14 });
  doc.text("Amount", left + tierW + 6, doc.y + 6, { width: amountW - 12 });
  doc.text("Coverage", left + tierW + amountW + 8, doc.y + 6, {
    width: coverageW - 16
  });
  doc.y += headerH;

  SPONSORSHIP_COVERAGE.forEach((tier) => {
    ensureSpace(doc, 60);
    const startY = doc.y;
    const padding = 8;

    doc
      .fillColor(COLORS.text)
      .font(FONTS.bold)
      .fontSize(10)
      .text(tier.name, left + 10, startY + padding, { width: tierW - 14 });

    doc
      .font(FONTS.bold)
      .fillColor(COLORS.accent)
      .text(tier.amountLabel, left + tierW + 6, startY + padding, {
        width: amountW - 12
      });

    doc.fillColor(COLORS.text).font(FONTS.body).fontSize(9.5);
    let bulletY = startY + padding;
    tier.benefits.forEach((benefit) => {
      doc.text("\u2022 " + benefit, left + tierW + amountW + 8, bulletY, {
        width: coverageW - 16
      });
      bulletY = doc.y;
    });

    const rowEnd = Math.max(doc.y, bulletY) + padding;

    // Row separator
    doc
      .moveTo(left, rowEnd)
      .lineTo(left + width, rowEnd)
      .lineWidth(0.5)
      .strokeColor(COLORS.rule)
      .stroke();

    // Vertical separators
    doc
      .moveTo(left + tierW, startY)
      .lineTo(left + tierW, rowEnd)
      .stroke();
    doc
      .moveTo(left + tierW + amountW, startY)
      .lineTo(left + tierW + amountW, rowEnd)
      .stroke();

    doc.y = rowEnd;
  });
}

function drawUploadRequest(doc, uploadUrl) {
  ensureSpace(doc, 110);
  drawSectionHeading(doc, "Sponsor Media Upload Request");

  doc
    .font(FONTS.body)
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(
      "Please upload high-definition logo files, media files, promotional materials, brand guidelines and approved sponsor text using the secure pCloud upload request below:",
      { align: "left", lineGap: 2 }
    );

  doc.moveDown(0.4);

  doc
    .fillColor(COLORS.brandTeal)
    .font(FONTS.bold)
    .fontSize(10)
    .text(uploadUrl, {
      link: uploadUrl,
      underline: true,
      lineGap: 2
    });

  doc.fillColor(COLORS.text);
}

function drawAuthorisedBy(doc) {
  ensureSpace(doc, 60);
  doc.moveDown(1.4);
  doc
    .font(FONTS.bold)
    .fontSize(12)
    .fillColor(COLORS.text)
    .text("Authorized by");

  doc.moveDown(0.2);
  doc
    .font(FONTS.body)
    .fontSize(11)
    .text("Stichting The V.O.I.C.E. NL");
}

function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const bottom = doc.page.height - doc.page.margins.bottom + 14;
    doc
      .font(FONTS.body)
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        "Stichting The V.O.I.C.E. NL  -  Sponsorship Receipt",
        doc.page.margins.left,
        bottom,
        {
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right,
          align: "center"
        }
      );
  }
}

/**
 * Render the sponsorship receipt as a PDF and resolve with a Buffer.
 *
 * @param {object} payload
 * @param {string} payload.receiptNumber  e.g. "VOICE-2026-9F8E2A1B"
 * @param {string} payload.stripePaymentId
 * @param {string} payload.paymentDate    Pre-formatted date string
 * @param {string} payload.sponsorName
 * @param {string} payload.sponsorEmail
 * @param {string} payload.companyName
 * @param {string} payload.sponsorshipTier
 * @param {string} payload.sponsorshipAmount  Pre-formatted currency string
 * @param {string} payload.paymentMethod  e.g. "Card via Stripe"
 * @param {string} payload.paymentStatus  Default "Paid"
 * @param {string} payload.uploadUrl
 * @param {string} payload.contactEmail
 * @param {string} payload.orgTagline
 */
export function renderSponsorshipReceiptPdf(payload) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
        bufferPages: true,
        info: {
          Title: `Sponsorship Receipt ${payload.receiptNumber || ""}`.trim(),
          Author: "Stichting The V.O.I.C.E. NL",
          Subject: "Sponsorship Receipt",
          Producer: "Stichting The V.O.I.C.E. NL",
          Creator: "Stichting The V.O.I.C.E. NL"
        }
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawHeader(doc, {
        contactEmail: payload.contactEmail,
        orgTagline:
          payload.orgTagline ||
          "The voice of international cultural exchange in the Netherlands"
      });

      drawTitle(
        doc,
        "Sponsorship Receipt",
        "English PDF receipt for the Stripe sponsorship flow"
      );

      drawInfoTable(doc, [
        { label: "Receipt Number", value: payload.receiptNumber },
        { label: "Payment Reference", value: payload.stripePaymentId },
        { label: "Receipt Date", value: payload.paymentDate },
        { label: "Sponsor Name", value: payload.sponsorName },
        { label: "Company Name", value: payload.companyName || "-" },
        { label: "Sponsor Email", value: payload.sponsorEmail },
        { label: "Sponsorship Tier", value: payload.sponsorshipTier },
        { label: "Sponsorship Amount", value: payload.sponsorshipAmount },
        { label: "Payment Method", value: payload.paymentMethod },
        { label: "Payment Status", value: payload.paymentStatus || "Paid" }
      ]);

      doc.moveDown(0.8);
      doc
        .font(FONTS.italic)
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(
          "This receipt confirms that Stichting The V.O.I.C.E. NL has received the sponsorship contribution described above with thanks and appreciation.",
          { lineGap: 2 }
        );

      drawSectionHeading(doc, "Sponsorship Coverage");
      drawCoverageTable(doc);

      drawUploadRequest(doc, payload.uploadUrl);
      drawAuthorisedBy(doc);
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default renderSponsorshipReceiptPdf;
