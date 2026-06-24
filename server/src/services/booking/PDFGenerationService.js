export { renderTicketPdf, generateTicketPdfFromDocs } from "../ticketPdfService.js";
export { getSessionBookingPdfBuffer, getRsvpResponsePdfBuffer } from "../sessionPlatformService.js";

import { generateTicketPdfFromDocs } from "../ticketPdfService.js";
import { getSessionBookingPdfBuffer, getRsvpResponsePdfBuffer } from "../sessionPlatformService.js";
import Ticket from "../../models/Ticket.js";
import TicketOrder from "../../models/TicketOrder.js";
import Event from "../../models/Event.js";

export async function generatePdfForBooking({ kind, ticketId, bookingId, eventSlug, responseId }) {
  if (kind === "session") return getSessionBookingPdfBuffer(bookingId);
  if (kind === "rsvp") return getRsvpResponsePdfBuffer(eventSlug, responseId);
  if (kind === "ticket") {
    const ticket = await Ticket.findById(ticketId).lean();
    const order = await TicketOrder.findById(ticket?.orderId).lean();
    const event = await Event.findById(order?.eventId).lean();
    if (!ticket || !order || !event) throw new Error("Ticket PDF data not found.");
    return generateTicketPdfFromDocs(ticket, order, event);
  }
  throw new Error(`Unsupported PDF kind: ${kind}`);
}
