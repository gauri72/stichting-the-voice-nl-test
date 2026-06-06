import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import env from "../config/env.js";

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

const COLORS = {
  navy: "#06152f",
  teal: "#008080",
  muted: "#5a6d82",
  border: "#d0d5dd",
  panel: "#f8fafc"
};

function bufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/**
 * @param {Record<string, string>} values
 * @returns {Promise<Buffer>}
 */
export async function renderMembershipReceiptPdf(values) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const promise = bufferFromDoc(doc);

  if (fs.existsSync(HEADER_LOGO_PATH)) {
    doc.image(HEADER_LOGO_PATH, 48, 48, { width: 56 });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("Stichting The V.O.I.C.E. NL", 120, 52);

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.navy)
    .text("Membership Receipt", 48, 120);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(`Receipt No: ${values.receipt_number || ""}`, 48, 152);

  const boxY = 180;
  doc.roundedRect(48, boxY, 500, 88, 8).fillAndStroke(COLORS.panel, COLORS.border);

  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(10);
  const leftX = 60;
  const rightX = 300;
  let y = boxY + 16;
  const rows = [
    ["Member Name", values.member_name],
    ["Email", values.member_email],
    ["Membership ID", values.membership_id],
    ["Membership Type", values.membership_type]
  ];
  rows.forEach(([label, value], index) => {
    const rowY = y + index * 18;
    doc.text(label, leftX, rowY, { width: 110 });
    doc.font("Helvetica").text(value || "", rightX, rowY, { width: 220 });
    doc.font("Helvetica-Bold");
  });

  y = boxY + 108;
  doc.roundedRect(48, y, 240, 70, 8).fillAndStroke(COLORS.panel, COLORS.border);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.navy);
  doc.text("Valid From", 60, y + 14);
  doc.font("Helvetica").text(values.valid_from || "", 60, y + 28);
  doc.font("Helvetica-Bold").text("Valid Until", 60, y + 44);
  doc.font("Helvetica").text(values.valid_until || "", 140, y + 44);

  doc.roundedRect(308, y, 240, 70, 8).fillAndStroke(COLORS.panel, COLORS.border);
  doc.font("Helvetica-Bold").text("Payment Status", 320, y + 14);
  doc.font("Helvetica").text(values.payment_status || "Paid", 320, y + 28);
  doc.font("Helvetica-Bold").text("Payment Method", 320, y + 44);
  doc.font("Helvetica").text(values.payment_method || "", 430, y + 44, { width: 110 });

  y += 92;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.navy).text("Payment Summary", 48, y);
  y += 20;
  doc.roundedRect(48, y, 500, 84, 8).stroke(COLORS.border);
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.navy);
  doc.text(`${values.membership_type || "Membership"} - Annual Membership`, 60, y + 16, { width: 320 });
  doc.text(`€${values.subtotal || values.total_paid || "0.00"}`, 430, y + 16, { align: "right", width: 100 });
  doc.text("VAT / Tax", 60, y + 36);
  doc.text(`€${values.tax_amount || "0.00"}`, 430, y + 36, { align: "right", width: 100 });
  doc.font("Helvetica-Bold").text("Total Paid", 60, y + 58);
  doc.text(`€${values.total_paid || "0.00"}`, 430, y + 58, { align: "right", width: 100 });

  y += 110;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(
      "Thank you for supporting cultural exchange and community through Stichting The V.O.I.C.E. NL.",
      48,
      y,
      { width: 500, lineGap: 4 }
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(env.org.tagline, 48, 760, { width: 500, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(8)
    .text("© 2026 Stichting The V.O.I.C.E. NL", 48, 780, { width: 500, align: "center" });

  return promise;
}
