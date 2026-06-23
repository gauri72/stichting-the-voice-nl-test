import PDFDocument from "pdfkit";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";

function collect(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export async function generateSessionBookingPdf({ booking, session }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const done = collect(doc);
  let qr = null;
  try {
    if (booking?.checkInToken) qr = await generateTicketQrPngBuffer(booking.checkInToken);
  } catch {
    qr = null;
  }

  doc.fontSize(22).text("V.O.I.C.E. NL Session Booking", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4a5568").text("Booking confirmation document");
  doc.moveDown(1.2);

  const rows = [
    ["Booking ID", booking?.bookingId || "—"],
    ["Customer", booking?.customerName || "—"],
    ["Email", booking?.customerEmail || "—"],
    ["Session", session?.name || booking?.sessionId || "—"],
    ["Date & Time", formatDateTime(booking?.startsAt)],
    ["Ends", formatDateTime(booking?.endsAt)],
    ["Location", session?.location || "—"],
    ["Participants", String(booking?.participants || 1)],
    ["Status", booking?.bookingStatus || "—"],
    ["Payment", booking?.paymentStatus || "—"],
    ["Total", `€${((booking?.totalMinor || 0) / 100).toFixed(2)}`],
  ];

  let y = 130;
  for (const [label, value] of rows) {
    doc.fontSize(9).fillColor("#718096").text(label.toUpperCase(), 40, y);
    doc.fontSize(12).fillColor("#1a202c").text(value, 40, y + 14, { width: 320 });
    y += 40;
  }

  if (qr) {
    doc.image(qr, 390, 140, { width: 160, height: 160 });
    doc.fontSize(9).fillColor("#4a5568").text("Scan to check in", 390, 306, { width: 160, align: "center" });
  }

  doc.fontSize(8).fillColor("#718096").text(
    "Please keep this document for your records. You may show the QR code at check-in.",
    40,
    760,
    { align: "center", width: 515 }
  );
  doc.end();
  return done;
}

export async function generateRsvpPdf({ event, response }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const done = collect(doc);
  let qr = null;
  try {
    if (response?.checkInToken) qr = await generateTicketQrPngBuffer(response.checkInToken);
  } catch {
    qr = null;
  }

  doc.fontSize(22).text("V.O.I.C.E. NL RSVP Confirmation");
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4a5568").text("RSVP receipt");
  doc.moveDown(1.2);

  const rows = [
    ["RSVP ID", response?.responseId || "—"],
    ["Guest", response?.name || "—"],
    ["Email", response?.email || "—"],
    ["Event", event?.eventName || "—"],
    ["Date", formatDateTime(event?.eventDate)],
    ["Time", [event?.startTime, event?.endTime].filter(Boolean).join(" - ") || "—"],
    ["Venue", event?.venue || "—"],
    ["Status", response?.status || "—"],
    ["Guest Count", String(response?.guestCount || 0)],
  ];

  let y = 130;
  for (const [label, value] of rows) {
    doc.fontSize(9).fillColor("#718096").text(label.toUpperCase(), 40, y);
    doc.fontSize(12).fillColor("#1a202c").text(value, 40, y + 14, { width: 320 });
    y += 40;
  }

  if (qr) {
    doc.image(qr, 390, 140, { width: 160, height: 160 });
    doc.fontSize(9).fillColor("#4a5568").text("Scan for RSVP check-in", 390, 306, {
      width: 160,
      align: "center",
    });
  }

  doc.end();
  return done;
}
import PDFDocument from "pdfkit";
import { generateTicketQrPngBuffer } from "./ticketQrService.js";

function collect(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export async function generateSessionBookingPdf({ booking, session }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const done = collect(doc);
  let qr = null;
  try {
    if (booking?.checkInToken) qr = await generateTicketQrPngBuffer(booking.checkInToken);
  } catch {
    qr = null;
  }

  doc.fontSize(22).text("V.O.I.C.E. NL Session Booking", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4a5568").text("Booking confirmation document");
  doc.moveDown(1.2);

  const rows = [
    ["Booking ID", booking?.bookingId || "—"],
    ["Customer", booking?.customerName || "—"],
    ["Email", booking?.customerEmail || "—"],
    ["Session", session?.name || booking?.sessionId || "—"],
    ["Date & Time", formatDateTime(booking?.startsAt)],
    ["Ends", formatDateTime(booking?.endsAt)],
    ["Location", session?.location || "—"],
    ["Participants", String(booking?.participants || 1)],
    ["Status", booking?.bookingStatus || "—"],
    ["Payment", booking?.paymentStatus || "—"],
    ["Total", `€${((booking?.totalMinor || 0) / 100).toFixed(2)}`],
  ];

  let y = 130;
  for (const [label, value] of rows) {
    doc.fontSize(9).fillColor("#718096").text(label.toUpperCase(), 40, y);
    doc.fontSize(12).fillColor("#1a202c").text(value, 40, y + 14, { width: 320 });
    y += 40;
  }

  if (qr) {
    doc.image(qr, 390, 140, { width: 160, height: 160 });
    doc.fontSize(9).fillColor("#4a5568").text("Scan to check in", 390, 306, { width: 160, align: "center" });
  }

  doc.fontSize(8).fillColor("#718096").text(
    "Please keep this document for your records. You may show the QR code at check-in.",
    40,
    760,
    { align: "center", width: 515 }
  );
  doc.end();
  return done;
}

export async function generateRsvpPdf({ event, response }) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const done = collect(doc);
  let qr = null;
  try {
    if (response?.checkInToken) qr = await generateTicketQrPngBuffer(response.checkInToken);
  } catch {
    qr = null;
  }

  doc.fontSize(22).text("V.O.I.C.E. NL RSVP Confirmation");
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#4a5568").text("RSVP receipt");
  doc.moveDown(1.2);

  const rows = [
    ["RSVP ID", response?.responseId || "—"],
    ["Guest", response?.name || "—"],
    ["Email", response?.email || "—"],
    ["Event", event?.eventName || "—"],
    ["Date", formatDateTime(event?.eventDate)],
    ["Time", [event?.startTime, event?.endTime].filter(Boolean).join(" - ") || "—"],
    ["Venue", event?.venue || "—"],
    ["Status", response?.status || "—"],
    ["Guest Count", String(response?.guestCount || 0)],
  ];

  let y = 130;
  for (const [label, value] of rows) {
    doc.fontSize(9).fillColor("#718096").text(label.toUpperCase(), 40, y);
    doc.fontSize(12).fillColor("#1a202c").text(value, 40, y + 14, { width: 320 });
    y += 40;
  }

  if (qr) {
    doc.image(qr, 390, 140, { width: 160, height: 160 });
    doc.fontSize(9).fillColor("#4a5568").text("Scan for RSVP check-in", 390, 306, {
      width: 160,
      align: "center",
    });
  }

  doc.end();
  return done;
}
