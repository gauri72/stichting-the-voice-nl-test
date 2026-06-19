import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");

const COLORS = {
  pageBg: "#EDF5F7",
  navy: "#002147",
  teal: "#008080",
  footerBar: "#084d69",
  border: "#E5EEEE",
  white: "#ffffff",
  black: "#000000",
  muted: "#666666",
  text: "#17314b",
};

const FOOTER_TEXT = "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.";

function logoPath() {
  return fs.existsSync(HEADER_LOGO_PATH) ? HEADER_LOGO_PATH : null;
}

function drawBrandedHeader(doc, title, subtitle) {
  const left = doc.page.margins.left;
  const logo = logoPath();
  let y = 40;
  if (logo) {
    doc.image(logo, left, y, { height: 44 });
    y += 52;
  }
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(11).text("STICHTING", left, y);
  doc.fillColor(COLORS.teal).fontSize(13).text("The V.O.I.C.E. NL", left, y + 14);
  doc.fillColor(COLORS.black).font("Helvetica-Bold").fontSize(18).text(title, left, y + 40);
  if (subtitle) {
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text(subtitle, left, doc.y + 4);
  }
  doc.moveDown(1.5);
}

function drawFooterBar(doc) {
  const barH = 32;
  const y = doc.page.height - barH - 8;
  doc.save();
  doc.rect(0, y, doc.page.width, barH).fill(COLORS.footerBar);
  doc.fillColor(COLORS.white).font("Helvetica").fontSize(8).text(FOOTER_TEXT, 0, y + 11, {
    width: doc.page.width,
    align: "center",
  });
  doc.restore();
}

function drawTableRow(doc, cols, y, widths, bold = false) {
  const left = doc.page.margins.left;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(COLORS.text);
  let x = left;
  cols.forEach((col, i) => {
    doc.text(String(col ?? ""), x, y, { width: widths[i], lineBreak: false });
    x += widths[i];
  });
}

function pdfBuffer(buildFn) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 48, left: 48, right: 48 },
        bufferPages: true,
        info: { Author: "Stichting The V.O.I.C.E. NL" },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      buildFn(doc);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export function renderInvoicePdf(payload) {
  return pdfBuffer((doc) => {
    drawBrandedHeader(doc, "Invoice", `Invoice No: ${payload.invoiceNumber || ""}`);
    const left = doc.page.margins.left;
    const w = doc.page.width - left - doc.page.margins.right;

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
    doc.text(`Invoice Date: ${payload.invoiceDate || ""}`, left);
    doc.text(`Due Date: ${payload.dueDate || ""}`, left);
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Bill To:");
    doc.font("Helvetica");
    if (payload.clientName) doc.text(payload.clientName);
    if (payload.companyName) doc.text(payload.companyName);
    if (payload.contactPerson) doc.text(`Attn: ${payload.contactPerson}`);
    if (payload.email) doc.text(payload.email);
    if (payload.phone) doc.text(payload.phone);
    if (payload.address) doc.text(payload.address);
    if (payload.vatNumber) doc.text(`VAT: ${payload.vatNumber}`);
    doc.moveDown(1);

    const widths = [w * 0.4, w * 0.1, w * 0.15, w * 0.1, w * 0.1, w * 0.15];
    let y = doc.y;
    drawTableRow(doc, ["Description", "Qty", "Unit", "VAT%", "Disc.", "Total"], y, widths, true);
    y += 16;
    doc.moveTo(left, y).lineTo(left + w, y).strokeColor(COLORS.border).stroke();
    y += 6;

    for (const item of payload.lineItems || []) {
      drawTableRow(
        doc,
        [
          item.description,
          item.quantity,
          item.unitPriceFormatted || item.unitPrice,
          `${item.vatRate || 0}%`,
          item.discountFormatted || item.discount || "—",
          item.lineTotalFormatted || item.lineTotal,
        ],
        y,
        widths
      );
      y += 14;
    }

    doc.y = y + 10;
    doc.font("Helvetica-Bold").text(`Subtotal: ${payload.subtotalFormatted || payload.subtotal}`, { align: "right" });
    doc.text(`VAT: ${payload.vatAmountFormatted || payload.vatAmount}`, { align: "right" });
    if (payload.discountAmount) {
      doc.text(`Discount: ${payload.discountAmountFormatted || payload.discountAmount}`, { align: "right" });
    }
    doc.fontSize(12).text(`Total: ${payload.totalAmountFormatted || payload.totalAmount}`, { align: "right" });
    if (payload.amountPaid) {
      doc.fontSize(10).font("Helvetica").text(`Paid: ${payload.amountPaidFormatted}`, { align: "right" });
      doc.text(`Balance Due: ${payload.balanceDueFormatted}`, { align: "right" });
    }

    if (payload.paymentDetails) {
      doc.moveDown(1).font("Helvetica-Bold").text("Payment Details", left);
      doc.font("Helvetica").fontSize(9).text(payload.paymentDetails, left, doc.y, { width: w });
    }
    if (payload.footerNote) {
      doc.moveDown(0.5).font("Helvetica-Oblique").fontSize(8).text(payload.footerNote, left, doc.y, { width: w });
    }
    drawFooterBar(doc);
  });
}

export function renderBudgetPdf(payload) {
  return pdfBuffer((doc) => {
    drawBrandedHeader(doc, "Event Budget Sheet", payload.eventName || "");
    const left = doc.page.margins.left;
    const w = doc.page.width - left - doc.page.margins.right;

    doc.font("Helvetica").fontSize(10);
    doc.text(`Event Date: ${payload.eventDate || "—"}`);
    doc.text(`Venue: ${payload.venue || "—"}`);
    doc.text(`Status: ${payload.status || "—"}`);
    doc.moveDown(1);

    const section = (title, lines, cols, widths) => {
      doc.font("Helvetica-Bold").fontSize(11).text(title, left);
      doc.moveDown(0.3);
      let y = doc.y;
      drawTableRow(doc, cols, y, widths, true);
      y += 14;
      for (const line of lines || []) {
        drawTableRow(doc, line, y, widths);
        y += 13;
      }
      doc.y = y + 8;
    };

    const half = w / 3;
    const incWidths = [half, half, half];
    section(
      "Income",
      (payload.incomeLines || []).map((l) => [l.category, l.planned, l.actual]),
      ["Category", "Planned", "Actual"],
      incWidths
    );
    section(
      "Expenses",
      (payload.expenseLines || []).map((l) => [l.category, l.planned, l.actual]),
      ["Category", "Planned", "Actual"],
      incWidths
    );

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text(`Planned Net: ${payload.plannedNetResult}`, left);
    doc.text(`Actual Net: ${payload.actualNetResult}`, left);
    doc.text(`Variance: ${payload.variance}`, left);

    if (payload.approvalSection) {
      doc.moveDown(1).font("Helvetica").fontSize(9).text(payload.approvalSection, left, doc.y, { width: w });
    }
    drawFooterBar(doc);
  });
}

export function renderAuditReportPdf(payload) {
  return pdfBuffer((doc) => {
    drawBrandedHeader(doc, payload.title || "Audit Report", payload.reportPeriod || "");
    const left = doc.page.margins.left;
    const w = doc.page.width - left - doc.page.margins.right;

    doc.font("Helvetica").fontSize(9);
    doc.text(`Generated by: ${payload.generatedBy || "—"}`);
    doc.text(`Generated: ${payload.generatedAt || "—"}`);
    doc.moveDown(1);

    const blocks = [
      ["Executive Summary", payload.executiveSummary],
      ["Income Summary", payload.incomeSummary],
      ["Expense Summary", payload.expenseSummary],
      ["Event Performance", payload.eventPerformance],
      ["Receipts & Invoices", payload.receiptsInvoices],
      ["Audit Trail", payload.auditTrail],
      ["Attachments Register", payload.attachmentsRegister],
    ];

    for (const [heading, content] of blocks) {
      if (!content) continue;
      doc.font("Helvetica-Bold").fontSize(11).text(heading, left);
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(9).text(typeof content === "string" ? content : JSON.stringify(content, null, 2), left, doc.y, {
        width: w,
      });
      doc.moveDown(1);
    }
    drawFooterBar(doc);
  });
}
