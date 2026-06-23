import TicketType from "../models/TicketType.js";
import Event from "../models/Event.js";
import { formatTicketType } from "./eventService.js";
import { assertTicketTypePurchasable } from "../utils/ticketTypeStatus.js";

export async function getTicketTypeForEvent(eventId, ticketTypeId) {
  const ticketType = await TicketType.findOne({ _id: ticketTypeId, eventId }).lean();
  if (!ticketType) {
    const err = new Error("Invalid ticket type selected.");
    err.status = 400;
    throw err;
  }
  return formatTicketType(ticketType);
}

export async function validateTicketLineItems(event, items = []) {
  if (!items.length) {
    const err = new Error("Select at least one ticket.");
    err.status = 400;
    throw err;
  }

  const lineItems = [];
  let subtotalMinor = 0;

  for (const item of items) {
    const tt = await getTicketTypeForEvent(event.id, item.ticketTypeId);
    assertTicketTypePurchasable(tt, event);

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (qty > tt.maxPerOrder) {
      const err = new Error(`Maximum ${tt.maxPerOrder} tickets per order for ${tt.name}.`);
      err.status = 400;
      throw err;
    }
    if (qty > tt.available) {
      const err = new Error(`Only ${tt.available} tickets available for ${tt.name}.`);
      err.status = 400;
      throw err;
    }

    const lineTotal = tt.priceMinor * qty;
    subtotalMinor += lineTotal;
    lineItems.push({
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      quantity: qty,
      unitPriceMinor: tt.priceMinor,
      originalPriceMinor: lineTotal,
    });
  }

  return { lineItems, subtotalMinor };
}

export async function patchTicketType(eventId, ticketTypeId, payload = {}) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const ticketType = await TicketType.findOne({ _id: ticketTypeId, eventId });
  if (!ticketType) {
    const err = new Error("Ticket type not found.");
    err.status = 404;
    throw err;
  }

  const allowed = [
    "salesEnabled",
    "availableFrom",
    "availableUntil",
    "showPublicly",
    "hideUntilAvailable",
    "futureDisplayLabel",
    "soldOutDisplayMode",
    "name",
    "description",
    "priceMinor",
    "capacity",
    "maxPerOrder",
    "sortOrder",
    "status",
  ];

  for (const key of allowed) {
    if (payload[key] === undefined) continue;
    if (key === "availableFrom" || key === "availableUntil") {
      ticketType[key] = payload[key] ? new Date(payload[key]) : null;
      if (key === "availableFrom") ticketType.saleStartDate = ticketType.availableFrom;
      if (key === "availableUntil") ticketType.saleEndDate = ticketType.availableUntil;
      continue;
    }
    ticketType[key] = payload[key];
  }

  if (payload.saleStartDate !== undefined) {
    ticketType.saleStartDate = payload.saleStartDate ? new Date(payload.saleStartDate) : null;
    ticketType.availableFrom = ticketType.saleStartDate;
  }
  if (payload.saleEndDate !== undefined) {
    ticketType.saleEndDate = payload.saleEndDate ? new Date(payload.saleEndDate) : null;
    ticketType.availableUntil = ticketType.saleEndDate;
  }

  if (payload.visibility === "hide_completely") {
    ticketType.showPublicly = false;
    ticketType.status = "hidden";
  } else if (payload.visibility === "hide_until_available") {
    ticketType.showPublicly = true;
    ticketType.hideUntilAvailable = true;
    ticketType.status = "active";
  } else if (payload.visibility === "show_publicly") {
    ticketType.showPublicly = true;
    ticketType.hideUntilAvailable = false;
    if (ticketType.status === "hidden") ticketType.status = "active";
  }

  const sold = ticketType.soldCount || 0;
  if (ticketType.capacity > 0 && sold >= ticketType.capacity) {
    ticketType.status = "sold_out";
  }

  await ticketType.save();
  return formatTicketType(ticketType.toObject());
}

export async function setTicketTypeSales(eventId, ticketTypeId, salesEnabled) {
  return patchTicketType(eventId, ticketTypeId, { salesEnabled });
}
