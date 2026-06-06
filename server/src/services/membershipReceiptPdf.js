import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import env from "../config/env.js";
import { generateMembershipQrPngBuffer } from "./membershipQrService.js";

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
const SOCIAL_DIR = path.join(__dirname, "..", "assets", "email", "social");
const SOCIAL_ICON_FILES = ["facebook.png", "instagram.png", "youtube.png", "linkedin.png", "x.png"];

const COLORS = {
  navy: "#06152f",
  headerBand: "#0b2447",
  teal: "#0a8a98",
  muted: "#5a6d82",
  label: "#7a8aa0",
  border: "#d9e0ea",
  panel: "#f6f1e8",
  panelAlt: "#f8fafc",
  pink: "#d1007f",
  white: "#ffffff"
};

const PAGE_MARGIN = 40;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2;

function collectDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function labelValue(doc, label, value, x, y, width) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLORS.label)
    .text(String(label).toUpperCase(), x, y, { width, characterSpacing: 0.5 });
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.navy)
    .text(value || "—", x, y + 12, { width });
}

/**
 * Renders a membership receipt PDF that mirrors the membership receipt HTML template.
 * @param {Record<string, string>} values
 * @returns {Promise<Buffer>}
 */
export async function renderMembershipReceiptPdf(values) {
  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const promise = collectDoc(doc);

  let qrBuffer = null;
  if (values.verification_token) {
    try {
      qrBuffer = await generateMembershipQrPngBuffer(values.verification_token);
    } catch {
      qrBuffer = null;
    }
  }

  // Header band
  const bandHeight = 92;
  doc.rect(0, 0, 595.28, bandHeight).fill(COLORS.headerBand);
  if (fs.existsSync(HEADER_LOGO_PATH)) {
    doc.image(HEADER_LOGO_PATH, PAGE_MARGIN, 22, { height: 48 });
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.teal)
    .text("STICHTING THE V.O.I.C.E. NL", PAGE_MARGIN + 70, 26, { characterSpacing: 1 });
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.white)
    .text("Membership Receipt", PAGE_MARGIN + 70, 40);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#c7d3e6")
    .text(`Receipt No: ${values.receipt_number || ""}`, PAGE_MARGIN + 70, 68);

  // Member info card + QR box
  let y = bandHeight + 24;
  const colGap = 16;
  const leftW = CONTENT_WIDTH * 0.6 - colGap / 2;
  const rightW = CONTENT_WIDTH * 0.4 - colGap / 2;
  const rightX = PAGE_MARGIN + leftW + colGap;
  const infoH = 150;

  doc.roundedRect(PAGE_MARGIN, y, leftW, infoH, 8).fill(COLORS.panel);
  labelValue(doc, "Member Name", values.member_name, PAGE_MARGIN + 16, y + 16, leftW - 32);
  labelValue(doc, "Email", values.member_email, PAGE_MARGIN + 16, y + 50, leftW - 32);
  labelValue(doc, "Membership ID", values.membership_id, PAGE_MARGIN + 16, y + 84, leftW - 32);
  labelValue(doc, "Membership Type", values.membership_type, PAGE_MARGIN + 16, y + 118, leftW - 32);

  doc.roundedRect(rightX, y, rightW, infoH, 8).strokeColor(COLORS.border).lineWidth(1).stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLORS.label)
    .text("MEMBERSHIP QR CODE", rightX, y + 14, { width: rightW, align: "center" });
  if (qrBuffer) {
    const qrSize = 92;
    doc.image(qrBuffer, rightX + (rightW - qrSize) / 2, y + 30, { width: qrSize, height: qrSize });
  }
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text("Scan to verify membership", rightX, y + infoH - 22, { width: rightW, align: "center" });

  // Validity + payment cards
  y += infoH + 16;
  const cardH = 66;
  doc.roundedRect(PAGE_MARGIN, y, leftW, cardH, 8).strokeColor(COLORS.border).lineWidth(1).stroke();
  labelValue(doc, "Valid From", values.valid_from, PAGE_MARGIN + 16, y + 12, leftW / 2 - 20);
  labelValue(doc, "Valid Until", values.valid_until, PAGE_MARGIN + leftW / 2, y + 12, leftW / 2 - 20);

  doc.roundedRect(rightX, y, rightW, cardH, 8).strokeColor(COLORS.border).lineWidth(1).stroke();
  labelValue(doc, "Payment Status", values.payment_status || "Paid", rightX + 14, y + 12, rightW / 2 - 18);
  labelValue(
    doc,
    "Payment Method",
    values.payment_method || "Card via Stripe",
    rightX + rightW / 2,
    y + 12,
    rightW / 2 - 14
  );

  // Line items table
  y += cardH + 22;
  const tableHeadH = 26;
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, tableHeadH, 4).fill(COLORS.panel);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.label)
    .text("DESCRIPTION", PAGE_MARGIN + 14, y + 9, { characterSpacing: 0.5 });
  doc.text("AMOUNT", PAGE_MARGIN, y + 9, { width: CONTENT_WIDTH - 14, align: "right" });

  y += tableHeadH;
  const rows = [
    [`${values.membership_type || "Membership"} - Annual Membership`, `€${values.subtotal || values.total_paid || "0.00"}`],
    ["VAT / Tax", `€${values.tax_amount || "0.00"}`]
  ];
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.navy);
  rows.forEach(([desc, amt]) => {
    doc.text(desc, PAGE_MARGIN + 14, y + 8, { width: CONTENT_WIDTH - 120 });
    doc.text(amt, PAGE_MARGIN, y + 8, { width: CONTENT_WIDTH - 14, align: "right" });
    y += 26;
    doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.navy)
    .text("Total Paid", PAGE_MARGIN + 14, y + 10);
  doc.text(`€${values.total_paid || "0.00"}`, PAGE_MARGIN, y + 10, {
    width: CONTENT_WIDTH - 14,
    align: "right"
  });

  // Thank-you note
  y += 44;
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 56, 6).fill("#fdf2f8");
  doc.rect(PAGE_MARGIN, y, 4, 56).fill(COLORS.pink);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#4a3340")
    .text(
      "Thank you for supporting Stichting The V.O.I.C.E. NL. Your membership helps us create cultural experiences, empower communities and build meaningful connections.",
      PAGE_MARGIN + 18,
      y + 12,
      { width: CONTENT_WIDTH - 32, lineGap: 2 }
    );

  // Footer signature (logo bottom-left + contact details)
  const footerY = 726;
  doc
    .moveTo(PAGE_MARGIN, footerY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, footerY)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();

  let textX = PAGE_MARGIN;
  if (fs.existsSync(HEADER_LOGO_PATH)) {
    doc.image(HEADER_LOGO_PATH, PAGE_MARGIN, footerY + 12, { height: 44 });
    textX = PAGE_MARGIN + 58;
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text("Stichting The V.O.I.C.E. NL", textX, footerY + 12);
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(env.org.tagline, textX, footerY + 26, { width: CONTENT_WIDTH - (textX - PAGE_MARGIN) });
  doc
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(
      `Email: ${env.org.contactEmail}   |   Website: stichtingthevoice.nl`,
      textX,
      footerY + 38,
      { width: CONTENT_WIDTH - (textX - PAGE_MARGIN) }
    );
  doc
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text("KVK: 92180213   |   Office: +31 6 19032104", textX, footerY + 49, {
      width: CONTENT_WIDTH - (textX - PAGE_MARGIN)
    });

  // Social media icons (right side of the signature)
  const iconSize = 16;
  const iconGap = 8;
  const icons = SOCIAL_ICON_FILES.filter((file) => fs.existsSync(path.join(SOCIAL_DIR, file)));
  if (icons.length) {
    const rowWidth = icons.length * iconSize + (icons.length - 1) * iconGap;
    const labelText = "Follow us:";
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.navy);
    const labelWidth = doc.widthOfString(labelText);
    const startX = PAGE_MARGIN + CONTENT_WIDTH - rowWidth;
    const iconY = footerY + 30;
    doc.text(labelText, startX - labelWidth - 8, iconY + 4);
    icons.forEach((file, i) => {
      doc.image(path.join(SOCIAL_DIR, file), startX + i * (iconSize + iconGap), iconY, {
        width: iconSize,
        height: iconSize
      });
    });
  }

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.label)
    .text("© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.", PAGE_MARGIN, 792, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  doc.end();
  return promise;
}
