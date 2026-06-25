import PDFDocument from "pdfkit";
import Event from "../models/Event.js";
import {
  getOperationsOverview,
  listEventInventory,
  listTechnicalRider,
  listChecklists,
  listEventDocuments,
} from "./eventOperationsService.js";
import { collectPdfBuffer as collectDocBuffer } from "../utils/pdfBuffer.js";

const FOOTER_TEXT = "© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.";

function collectPdfBuffer(doc) {
  const result = collectDocBuffer(doc);
  doc.end();
  return result;
}

function drawFooter(doc) {
  const y = doc.page.height - 40;
  doc.font("Helvetica").fontSize(8).fillColor("#666666").text(FOOTER_TEXT, 50, y, {
    align: "center",
    width: doc.page.width - 100,
  });
}

async function getEventTitle(eventId) {
  const event = await Event.findById(eventId).select("title date venueName").lean();
  return event || { title: "Event", date: null, venueName: "" };
}

export async function exportInventoryPdf(eventId) {
  const event = await getEventTitle(eventId);
  const { items } = await listEventInventory(eventId);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.font("Helvetica-Bold").fontSize(16).text("Event Inventory", { align: "left" });
  doc.font("Helvetica").fontSize(10).text(`${event.title} — ${event.venueName || ""}`);
  doc.moveDown();
  doc.font("Helvetica-Bold").fontSize(9);
  const cols = ["Item", "Category", "Qty", "Status", "Supplier"];
  let y = doc.y;
  cols.forEach((c, i) => doc.text(c, 50 + i * 100, y, { width: 95 }));
  y += 14;
  doc.font("Helvetica").fontSize(8);
  for (const item of items) {
    if (y > doc.page.height - 80) {
      drawFooter(doc);
      doc.addPage();
      y = 50;
    }
    const row = [item.itemName, item.category, String(item.quantityNeeded), item.status, item.supplierVendor];
    row.forEach((c, i) => doc.text(String(c || "").slice(0, 40), 50 + i * 100, y, { width: 95 }));
    y += 12;
  }
  drawFooter(doc);
  return collectPdfBuffer(doc);
}

export async function exportTechnicalRiderPdf(eventId) {
  const event = await getEventTitle(eventId);
  const { items } = await listTechnicalRider(eventId);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.font("Helvetica-Bold").fontSize(16).text("Technical Rider", { align: "left" });
  doc.font("Helvetica").fontSize(10).text(`${event.title} — ${event.venueName || ""}`);
  doc.moveDown();
  let currentSection = "";
  for (const item of items) {
    if (item.section !== currentSection) {
      currentSection = item.section;
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#002147").text(currentSection);
      doc.fillColor("#000000");
    }
    doc.font("Helvetica").fontSize(9).text(
      `• ${item.requirement} (×${item.quantity}) — ${item.status}${item.specification ? `: ${item.specification}` : ""}`
    );
    if (item.responsiblePerson) doc.font("Helvetica").fontSize(8).fillColor("#666").text(`  Responsible: ${item.responsiblePerson}`);
    if (item.supplier) doc.text(`  Supplier: ${item.supplier}`);
    doc.fillColor("#000000");
  }
  drawFooter(doc);
  return collectPdfBuffer(doc);
}

export async function exportChecklistPdf(eventId) {
  const event = await getEventTitle(eventId);
  const { items } = await listChecklists(eventId);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.font("Helvetica-Bold").fontSize(16).text("Operations Checklist", { align: "left" });
  doc.font("Helvetica").fontSize(10).text(`${event.title}`);
  doc.moveDown();
  for (const item of items) {
    const check = item.status === "Done" ? "[✓]" : "[ ]";
    doc.font("Helvetica").fontSize(10).text(`${check} ${item.task} — ${item.status}`);
    if (item.assignedTo) doc.font("Helvetica").fontSize(8).fillColor("#666").text(`   Assigned: ${item.assignedTo}`);
    doc.fillColor("#000000");
  }
  drawFooter(doc);
  return collectPdfBuffer(doc);
}

export async function exportDocumentListPdf(eventId) {
  const event = await getEventTitle(eventId);
  const { documents } = await listEventDocuments(eventId);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.font("Helvetica-Bold").fontSize(16).text("Document List", { align: "left" });
  doc.font("Helvetica").fontSize(10).text(`${event.title}`);
  doc.moveDown();
  for (const d of documents) {
    doc.font("Helvetica").fontSize(9).text(`• ${d.documentName} [${d.category}] v${d.currentVersion}`);
  }
  drawFooter(doc);
  return collectPdfBuffer(doc);
}

export async function exportStagePlanPdf(eventId, planData = {}) {
  const event = await getEventTitle(eventId);
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
  doc.font("Helvetica-Bold").fontSize(16).text(`Stage Plan — ${planData.name || "Layout"}`, { align: "left" });
  doc.font("Helvetica").fontSize(10).text(`${event.title} — ${event.venueName || ""}`);
  doc.moveDown();
  if (planData.floorImageUrl && !planData.floorImageUrl.startsWith("data:")) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const localPath = path.join(process.cwd(), "public", planData.floorImageUrl.replace(/^\//, ""));
      if (fs.existsSync(localPath)) {
        doc.image(localPath, 50, doc.y, { fit: [700, 400], align: "center" });
      }
    } catch {
      doc.text("(Floor plan image not available for PDF export)");
    }
  } else if (planData.floorImageUrl?.startsWith("data:")) {
    try {
      doc.image(planData.floorImageUrl, 50, doc.y, { fit: [700, 400], align: "center" });
    } catch {
      doc.text("(Could not embed floor plan image)");
    }
  }
  doc.moveDown();
  if (Array.isArray(planData.elements)) {
    doc.font("Helvetica-Bold").fontSize(10).text("Elements:");
    for (const el of planData.elements) {
      doc.font("Helvetica").fontSize(8).text(`• ${el.elementType}${el.label ? `: ${el.label}` : ""}`);
    }
  }
  drawFooter(doc);
  return collectPdfBuffer(doc);
}

export async function exportOperations(type, eventId, extra = {}) {
  switch (type) {
    case "inventory_pdf":
      return { buffer: await exportInventoryPdf(eventId), filename: "inventory.pdf", contentType: "application/pdf" };
    case "inventory_csv": {
      const { exportInventoryCsv } = await import("./eventOperationsService.js");
      const csv = await exportInventoryCsv(eventId);
      return { buffer: Buffer.from(csv, "utf8"), filename: "inventory.csv", contentType: "text/csv" };
    }
    case "technical_rider_pdf":
      return { buffer: await exportTechnicalRiderPdf(eventId), filename: "technical-rider.pdf", contentType: "application/pdf" };
    case "checklist_pdf":
      return { buffer: await exportChecklistPdf(eventId), filename: "checklist.pdf", contentType: "application/pdf" };
    case "documents_pdf":
      return { buffer: await exportDocumentListPdf(eventId), filename: "documents.pdf", contentType: "application/pdf" };
    case "stage_plan_pdf":
      return {
        buffer: await exportStagePlanPdf(eventId, extra.plan || {}),
        filename: "stage-plan.pdf",
        contentType: "application/pdf",
      };
    default:
      throw Object.assign(new Error("Unknown export type."), { status: 400 });
  }
}
