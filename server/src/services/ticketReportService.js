import ExcelJS from "exceljs";
import sharp from "sharp";
import { listAdminTickets } from "./ticketAdminService.js";

const PIE_COLORS = ["#3ecf9a", "#f05e3c", "#3ec6d4", "#a78bfa", "#facc15", "#f472b6", "#60a5fa", "#fb923c"];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Renders a simple pie chart + legend as SVG. exceljs can't author native
 *  Excel chart objects, so this is rasterized (via sharp) and embedded as a
 *  static image instead — see server/src/services/ticketReportService.js. */
function buildPieChartSvg(slices, size = 320) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  let angle = -Math.PI / 2;
  const paths = [];

  for (const slice of slices) {
    const fraction = slice.value / total;
    if (fraction <= 0) continue;
    const nextAngle = angle + fraction * Math.PI * 2;
    if (fraction >= 0.999) {
      paths.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${slice.color}" stroke="#ffffff" stroke-width="2" />`
      );
    } else {
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle);
      const y2 = cy + r * Math.sin(nextAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;
      paths.push(
        `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${slice.color}" stroke="#ffffff" stroke-width="2" />`
      );
    }
    angle = nextAngle;
  }

  const legendX = size + 24;
  const legend = slices
    .map((slice, i) => {
      const y = 16 + i * 24;
      return `<rect x="${legendX}" y="${y}" width="14" height="14" fill="${slice.color}" />
        <text x="${legendX + 20}" y="${y + 11}" font-size="13" font-family="Arial, sans-serif" fill="#1e293b">${escapeXml(slice.label)} — ${slice.value}</text>`;
    })
    .join("\n");

  const width = size + 260;
  const height = Math.max(size, 16 + slices.length * 24 + 12);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    ${paths.join("\n")}
    ${legend}
  </svg>`;
}

/** Actual price paid for one ticket = the matching order line item's
 *  finalPriceMinor (per-unit, post-discount) for that ticket's type —
 *  Ticket itself carries no price field (see TicketOrder.lineItems). */
function ticketPriceMinor(ticket) {
  const lineItem = (ticket.order?.lineItems || []).find(
    (item) => String(item.ticketTypeId) === String(ticket.ticketTypeId)
  );
  return lineItem ? Number(lineItem.finalPriceMinor || 0) : 0;
}

export async function generateTicketsReportExcel(filters = {}) {
  const { tickets } = await listAdminTickets({ ...filters, page: 1, limit: 10000 });

  const rows = tickets.map((ticket) => ({ ...ticket, priceMinor: ticketPriceMinor(ticket) }));

  const byType = new Map();
  for (const row of rows) {
    const key = row.ticketTypeName || "Unknown";
    const agg = byType.get(key) || { count: 0, totalMinor: 0 };
    agg.count += 1;
    agg.totalMinor += row.priceMinor;
    byType.set(key, agg);
  }
  const summary = [...byType.entries()].map(([label, agg], i) => ({
    label,
    count: agg.count,
    totalMinor: agg.totalMinor,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const grandTotalCount = rows.length;
  const grandTotalMinor = rows.reduce((sum, row) => sum + row.priceMinor, 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Stichting The V.O.I.C.E. NL";
  workbook.created = new Date();

  const ticketsSheet = workbook.addWorksheet("Tickets");
  ticketsSheet.columns = [
    { header: "Ticket Number", key: "ticketNumber", width: 20 },
    { header: "Event", key: "eventTitle", width: 32 },
    { header: "Category", key: "ticketTypeName", width: 20 },
    { header: "Attendee", key: "attendeeName", width: 24 },
    { header: "Email", key: "attendeeEmail", width: 28 },
    { header: "Price (EUR)", key: "price", width: 14 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Checked In", key: "checkedIn", width: 12 },
    { header: "Created", key: "createdAt", width: 20 },
  ];
  ticketsSheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    ticketsSheet.addRow({
      ticketNumber: row.ticketNumber,
      eventTitle: row.eventTitle,
      ticketTypeName: row.ticketTypeName,
      attendeeName: row.attendeeName,
      attendeeEmail: row.attendeeEmail,
      price: Number(row.priceMinor || 0) / 100,
      paymentStatus: row.order?.paymentStatus || "",
      checkedIn: row.checkedIn ? "Yes" : "No",
      createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString("nl-NL") : "",
    });
  }
  ticketsSheet.getColumn("price").numFmt = '"€"#,##0.00';

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Category", key: "label", width: 24 },
    { header: "Total Tickets", key: "count", width: 16 },
    { header: "Total Price (EUR)", key: "total", width: 20 },
  ];
  summarySheet.getRow(1).font = { bold: true };
  for (const s of summary) {
    summarySheet.addRow({ label: s.label, count: s.count, total: Number(s.totalMinor) / 100 });
  }
  summarySheet.addRow({});
  const totalRow = summarySheet.addRow({
    label: "Grand Total",
    count: grandTotalCount,
    total: Number(grandTotalMinor) / 100,
  });
  totalRow.font = { bold: true };
  summarySheet.getColumn("total").numFmt = '"€"#,##0.00';

  if (summary.length) {
    const svg = buildPieChartSvg(summary.map((s) => ({ label: s.label, value: s.count, color: s.color })));
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const imageId = workbook.addImage({ buffer: pngBuffer, extension: "png" });
    summarySheet.addImage(imageId, { tl: { col: 4, row: 1 }, ext: { width: 480, height: 300 } });
  }

  return workbook.xlsx.writeBuffer();
}
