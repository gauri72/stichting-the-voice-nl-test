import crypto from "crypto";
import mongoose from "mongoose";
import SeatMap from "../models/SeatMap.js";
import Seat from "../models/Seat.js";
import SeatHold from "../models/SeatHold.js";
import { DEFAULT_SEAT_MAP_SETTINGS, SEAT_AUDIT_ACTIONS, defaultSeatLabel } from "../config/seatConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import { getNextSequence } from "../utils/sequence.js";

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function generateSeatId() {
  return `seat-${crypto.randomUUID()}`;
}

async function nextSeatMapId() {
  const seq = await getNextSequence("seat_map");
  return `SM-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;
}

async function nextSeatHoldId() {
  const seq = await getNextSequence("seat_hold");
  return `SH-${Date.now()}-${seq}`;
}

function formatSeatMap(doc) {
  if (!doc) return null;
  const settings = { ...DEFAULT_SEAT_MAP_SETTINGS, ...(doc.settings || {}) };
  return {
    seatMapId: doc.seatMapId,
    eventId: doc.eventId?.toString?.() || doc.eventId,
    name: doc.name,
    venueName: doc.venueName,
    imageUrl: doc.imageUrl,
    imageWidth: doc.imageWidth,
    imageHeight: doc.imageHeight,
    stageLabel: doc.stageLabel || settings.stageLabel,
    seatingMode: doc.seatingMode || settings.seatingMode,
    settings,
    updatedAt: doc.updatedAt,
  };
}

function formatSeat(doc) {
  return {
    seatId: doc.seatId,
    seatMapId: doc.seatMapId,
    eventId: doc.eventId?.toString?.() || doc.eventId,
    section: doc.section,
    row: doc.row,
    seatNumber: doc.seatNumber,
    seatLabel: doc.seatLabel || defaultSeatLabel(doc.row, doc.seatNumber),
    category: doc.category,
    ticketTypeId: doc.ticketTypeId?.toString?.() || doc.ticketTypeId || null,
    priceOverrideMinor: doc.priceOverrideMinor,
    status: doc.status,
    xPercent: doc.xPercent,
    yPercent: doc.yPercent,
    width: doc.width,
    height: doc.height,
    metadata: doc.metadata || {},
  };
}

export async function getSeatMapByEventId(eventId) {
  const doc = await SeatMap.findOne({ eventId }).lean();
  return formatSeatMap(doc);
}

export async function getOrCreateSeatMap(eventId, adminId) {
  let doc = await SeatMap.findOne({ eventId });
  if (!doc) {
    doc = await SeatMap.create({
      seatMapId: await nextSeatMapId(),
      eventId,
      settings: { ...DEFAULT_SEAT_MAP_SETTINGS },
      createdBy: adminId,
      updatedBy: adminId,
    });
    await logAdminAction({
      adminId,
      action: SEAT_AUDIT_ACTIONS.SEAT_MAP_CREATED,
      targetType: "seat_map",
      targetId: doc.seatMapId,
      summary: "Seat map created",
    });
  }
  return formatSeatMap(doc.toObject());
}

export async function updateSeatMap(eventId, payload, adminId) {
  const doc = await SeatMap.findOne({ eventId });
  if (!doc) throwError("Seat map not found.", 404);

  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.venueName !== undefined) doc.venueName = payload.venueName;
  if (payload.stageLabel !== undefined) doc.stageLabel = payload.stageLabel;
  if (payload.seatingMode !== undefined) doc.seatingMode = payload.seatingMode;
  if (payload.settings) doc.settings = { ...(doc.settings || {}), ...payload.settings };
  if (payload.imageUrl !== undefined) {
    doc.imageUrl = payload.imageUrl;
    if (payload.imageWidth) doc.imageWidth = payload.imageWidth;
    if (payload.imageHeight) doc.imageHeight = payload.imageHeight;
    await logAdminAction({
      adminId,
      action: SEAT_AUDIT_ACTIONS.SEAT_MAP_IMAGE_UPLOADED,
      targetType: "seat_map",
      targetId: doc.seatMapId,
      summary: "Seat map image updated",
    });
  }
  doc.updatedBy = adminId;
  await doc.save();
  return formatSeatMap(doc.toObject());
}

export async function listSeatsForEvent(eventId, { includeDisabled = true } = {}) {
  const query = { eventId };
  if (!includeDisabled) query.status = { $ne: "disabled" };
  const seats = await Seat.find(query).sort({ row: 1, seatNumber: 1 }).lean();
  return seats.map(formatSeat);
}

export async function createSeat(eventId, payload, adminId) {
  const seatMap = await getOrCreateSeatMap(eventId, adminId);
  const seatId = generateSeatId();
  const seat = await Seat.create({
    seatId,
    seatMapId: seatMap.seatMapId,
    eventId,
    section: payload.section || "Main Hall",
    row: payload.row,
    seatNumber: String(payload.seatNumber),
    seatLabel: payload.seatLabel || defaultSeatLabel(payload.row, payload.seatNumber),
    category: payload.category || "regular",
    ticketTypeId: payload.ticketTypeId || null,
    priceOverrideMinor: payload.priceOverrideMinor ?? null,
    status: payload.status || "available",
    xPercent: payload.xPercent ?? 0,
    yPercent: payload.yPercent ?? 0,
    width: payload.width ?? 2.5,
    height: payload.height ?? 2.5,
    metadata: payload.metadata || {},
  });
  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEAT_CREATED,
    targetType: "seat",
    targetId: seatId,
    summary: `Seat ${seat.seatLabel} created`,
  });
  return formatSeat(seat.toObject());
}

export async function bulkCreateSeats(eventId, payload, adminId) {
  const seatMap = await getOrCreateSeatMap(eventId, adminId);
  const {
    section = "Main Hall",
    startRow = "A",
    endRow = "A",
    seatsPerRow = 10,
    startingSeatNumber = 1,
    category = "regular",
    ticketTypeId = null,
    priceOverrideMinor = null,
    startX = 10,
    startY = 20,
    rowSpacing = 5,
    seatSpacing = 4,
  } = payload;

  const rowStart = startRow.toUpperCase().charCodeAt(0);
  const rowEnd = endRow.toUpperCase().charCodeAt(0);
  const created = [];

  for (let r = rowStart; r <= rowEnd; r += 1) {
    const row = String.fromCharCode(r);
    const rowIndex = r - rowStart;
    for (let s = 0; s < seatsPerRow; s += 1) {
      const seatNumber = String(startingSeatNumber + s);
      const seatId = generateSeatId();
      const seat = await Seat.create({
        seatId,
        seatMapId: seatMap.seatMapId,
        eventId,
        section,
        row,
        seatNumber,
        seatLabel: defaultSeatLabel(row, seatNumber),
        category,
        ticketTypeId: ticketTypeId || null,
        priceOverrideMinor,
        status: category === "blocked" ? "blocked" : "available",
        xPercent: startX + s * seatSpacing,
        yPercent: startY + rowIndex * rowSpacing,
        width: 2.5,
        height: 2.5,
      });
      created.push(formatSeat(seat.toObject()));
    }
  }

  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEATS_BULK_CREATED,
    targetType: "seat_map",
    targetId: seatMap.seatMapId,
    summary: `Bulk created ${created.length} seats`,
  });

  return created;
}

export async function updateSeat(eventId, seatId, payload, adminId) {
  const seat = await Seat.findOne({ eventId, seatId });
  if (!seat) throwError("Seat not found.", 404);
  const allowed = [
    "section", "row", "seatNumber", "seatLabel", "category", "ticketTypeId",
    "priceOverrideMinor", "status", "xPercent", "yPercent", "width", "height", "metadata",
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) seat[key] = payload[key];
  }
  if (payload.row || payload.seatNumber) {
    seat.seatLabel = seat.seatLabel || defaultSeatLabel(seat.row, seat.seatNumber);
  }
  await seat.save();
  await logAdminAction({
    adminId,
    action: payload.xPercent !== undefined ? SEAT_AUDIT_ACTIONS.SEAT_MOVED : SEAT_AUDIT_ACTIONS.SEAT_UPDATED,
    targetType: "seat",
    targetId: seatId,
    summary: `Seat ${seat.seatLabel} updated`,
  });
  return formatSeat(seat.toObject());
}

export async function deleteSeat(eventId, seatId, adminId) {
  const seat = await Seat.findOne({ eventId, seatId });
  if (!seat) throwError("Seat not found.", 404);
  if (seat.status === "booked") throwError("Cannot delete a booked seat.");
  await Seat.deleteOne({ seatId });
  return { deleted: true };
}

export async function blockSeats(eventId, seatIds, adminId) {
  await Seat.updateMany(
    { eventId, seatId: { $in: seatIds }, status: { $nin: ["booked"] } },
    { $set: { status: "blocked", category: "blocked" } }
  );
  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEAT_BLOCKED,
    targetType: "seat_map",
    targetId: eventId.toString(),
    summary: `Blocked ${seatIds.length} seats`,
  });
  return listSeatsForEvent(eventId);
}

export async function unblockSeats(eventId, seatIds, adminId) {
  await Seat.updateMany(
    { eventId, seatId: { $in: seatIds }, status: "blocked" },
    { $set: { status: "available", category: "regular" } }
  );
  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEAT_UNBLOCKED,
    targetType: "seat_map",
    targetId: eventId.toString(),
    summary: `Unblocked ${seatIds.length} seats`,
  });
  return listSeatsForEvent(eventId);
}

export async function repositionSeats(eventId, positions, adminId) {
  for (const pos of positions || []) {
    if (!pos.seatId) continue;
    await Seat.updateOne(
      { eventId, seatId: pos.seatId },
      { $set: { xPercent: pos.xPercent, yPercent: pos.yPercent, width: pos.width, height: pos.height } }
    );
  }
  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEAT_MOVED,
    targetType: "seat_map",
    targetId: eventId.toString(),
    summary: `Repositioned ${positions?.length || 0} seats`,
  });
  return listSeatsForEvent(eventId);
}

async function getActiveHoldsForSeats(seatIds) {
  if (!seatIds?.length) return [];
  return SeatHold.find({
    seatId: { $in: seatIds },
    status: "active",
    expiresAt: { $gt: new Date() },
  }).lean();
}

export async function getSeatAvailability(eventId, { checkoutSessionId } = {}) {
  const seatMap = await getSeatMapByEventId(eventId);
  const reservedSeatingEnabled =
    seatMap &&
    (seatMap.settings?.enableReservedSeating === true ||
      seatMap.seatingMode === "reserved_seating" ||
      seatMap.seatingMode === "mixed_seating");

  if (!reservedSeatingEnabled) {
    return { seatMap, seats: [], reservedSeatingEnabled: false };
  }

  const seats = await listSeatsForEvent(eventId);
  const holds = await SeatHold.find({
    eventId,
    status: "active",
    expiresAt: { $gt: new Date() },
  }).lean();

  const holdBySeat = new Map(holds.map((h) => [h.seatId, h]));

  const availability = seats.map((seat) => {
    const hold = holdBySeat.get(seat.seatId);
    const isOwnHold = hold && checkoutSessionId && hold.checkoutSessionId === checkoutSessionId;
    let effectiveStatus = seat.status;
    if (seat.status === "available" && hold && !isOwnHold) effectiveStatus = "held";
    return { ...seat, effectiveStatus, heldBySelf: Boolean(isOwnHold) };
  });

  return {
    seatMap,
    seats: availability,
    reservedSeatingEnabled: seatMap?.settings?.enableReservedSeating !== false,
  };
}

export async function holdSeats({
  eventId,
  seatIds,
  checkoutSessionId,
  userId,
  email,
  holdMinutes = 10,
}) {
  if (!seatIds?.length) throwError("No seats selected.");

  const seatMap = await getSeatMapByEventId(eventId);
  const minutes = seatMap?.settings?.seatHoldMinutes || holdMinutes;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  const seats = await Seat.find({ eventId, seatId: { $in: seatIds } });
  if (seats.length !== seatIds.length) throwError("One or more seats not found.");

  for (const seat of seats) {
    if (["booked", "blocked", "disabled", "reserved"].includes(seat.status)) {
      throwError(`Seat ${seat.seatLabel} is not available.`);
    }
    const activeHold = await SeatHold.findOne({
      seatId: seat.seatId,
      status: "active",
      expiresAt: { $gt: new Date() },
      checkoutSessionId: { $ne: checkoutSessionId || "" },
    });
    if (activeHold) throwError(`Seat ${seat.seatLabel} is currently held.`);
  }

  await releaseSeatHolds({ checkoutSessionId, eventId });

  const holds = [];
  for (const seatId of seatIds) {
    const hold = await SeatHold.create({
      seatHoldId: await nextSeatHoldId(),
      seatId,
      eventId,
      checkoutSessionId: checkoutSessionId || "",
      userId: userId || null,
      email: email || "",
      expiresAt,
      status: "active",
    });
    holds.push(hold);
  }

  return { holds, expiresAt, seats: seats.map((s) => formatSeat(s.toObject())) };
}

export async function releaseSeatHolds({ checkoutSessionId, eventId, seatIds }) {
  const query = { status: "active" };
  if (checkoutSessionId) query.checkoutSessionId = checkoutSessionId;
  if (eventId) query.eventId = eventId;
  if (seatIds?.length) query.seatId = { $in: seatIds };

  const result = await SeatHold.updateMany(query, { $set: { status: "released" } });
  return { released: result.modifiedCount };
}

export async function validateSeatsForCheckout(eventId, seatIds, ticketQuantity, ticketTypeIds = []) {
  const { seats, reservedSeatingEnabled, seatMap } = await getSeatAvailability(eventId);
  if (!reservedSeatingEnabled) return { ok: true, seats: [] };

  if (!seatIds?.length || seatIds.length !== ticketQuantity) {
    throwError(`Please select exactly ${ticketQuantity} seat(s).`);
  }

  const selected = seats.filter((s) => seatIds.includes(s.seatId));
  if (selected.length !== seatIds.length) throwError("Invalid seat selection.");

  for (const seat of selected) {
    if (seat.effectiveStatus !== "available" && !seat.heldBySelf) {
      throwError(`Seat ${seat.seatLabel} is no longer available.`);
    }
    if (seat.ticketTypeId && ticketTypeIds.length && !ticketTypeIds.includes(seat.ticketTypeId)) {
      throwError(`Seat ${seat.seatLabel} is not valid for the selected ticket type.`);
    }
  }

  return { ok: true, seats: selected, seatMap };
}

export async function bookSeatsForOrder(order, seatIds) {
  if (!seatIds?.length) return [];

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booked = [];
    for (const seatId of seatIds) {
      const updated = await Seat.findOneAndUpdate(
        { seatId, eventId: order.eventId, status: { $in: ["available", "held"] } },
        { $set: { status: "booked" } },
        { new: true, session }
      );
      if (!updated) {
        throwError(`Seat ${seatId} could not be booked.`);
      }
      booked.push(formatSeat(updated.toObject()));
    }

    await SeatHold.updateMany(
      { seatId: { $in: seatIds }, status: "active" },
      { $set: { status: "converted", orderId: order._id } },
      { session }
    );

    await session.commitTransaction();
    return booked;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function releaseSeatsFromOrder(order) {
  const seatIds = (order.selectedSeats || []).map((s) => s.seatId).filter(Boolean);
  if (!seatIds.length) return;
  await Seat.updateMany({ seatId: { $in: seatIds }, status: "booked" }, { $set: { status: "available" } });
  await releaseSeatHolds({ eventId: order.eventId, seatIds });
}

export async function changeTicketSeat(ticketId, newSeatId, adminId) {
  const Ticket = (await import("../models/Ticket.js")).default;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throwError("Ticket not found.", 404);

  const newSeat = await Seat.findOne({ seatId: newSeatId, eventId: ticket.eventId });
  if (!newSeat || newSeat.status !== "available") throwError("Target seat is not available.");

  if (ticket.seatId) {
    await Seat.updateOne({ seatId: ticket.seatId }, { $set: { status: "available" } });
  }

  newSeat.status = "booked";
  await newSeat.save();

  ticket.seatId = newSeat.seatId;
  ticket.seatMapId = newSeat.seatMapId;
  ticket.section = newSeat.section;
  ticket.row = newSeat.row;
  ticket.seatNumber = newSeat.seatNumber;
  ticket.seatLabel = newSeat.seatLabel;
  ticket.seatCategory = newSeat.category;
  await ticket.save();

  await logAdminAction({
    adminId,
    action: SEAT_AUDIT_ACTIONS.SEAT_CHANGED_ADMIN,
    targetType: "ticket",
    targetId: ticket.ticketNumber,
    summary: `Seat changed to ${newSeat.seatLabel}`,
  });

  return ticket.toObject();
}

export async function prepareOrderSeats({
  eventId,
  seatIds,
  ticketQuantity,
  ticketTypeIds = [],
  checkoutSessionId,
  email,
  userId,
}) {
  const { reservedSeatingEnabled, seatMap, seats } = await getSeatAvailability(eventId, {
    checkoutSessionId,
  });

  if (!reservedSeatingEnabled) {
    return { selectedSeats: [], seatingMode: seatMap?.seatingMode || "general_admission" };
  }

  let resolvedSeatIds = [...(seatIds || [])];

  if (!resolvedSeatIds.length && seatMap?.settings?.autoAssignSeats) {
    const available = seats
      .filter((s) => s.effectiveStatus === "available")
      .slice(0, ticketQuantity);
    resolvedSeatIds = available.map((s) => s.seatId);
  }

  const validation = await validateSeatsForCheckout(
    eventId,
    resolvedSeatIds,
    ticketQuantity,
    ticketTypeIds
  );

  if (checkoutSessionId && resolvedSeatIds.length) {
    await holdSeats({
      eventId,
      seatIds: resolvedSeatIds,
      checkoutSessionId,
      userId,
      email,
    });
  }

  const selectedSeats = validation.seats.map((s) => ({
    seatId: s.seatId,
    section: s.section,
    row: s.row,
    seatNumber: s.seatNumber,
    seatLabel: s.seatLabel,
    category: s.category,
    ticketTypeId: s.ticketTypeId,
  }));

  return {
    selectedSeats,
    seatingMode: seatMap?.seatingMode || "reserved_seating",
    seatMapId: seatMap?.seatMapId || "",
  };
}

export async function cleanupExpiredSeatHolds() {
  const now = new Date();
  const expired = await SeatHold.find({ status: "active", expiresAt: { $lte: now } }).lean();
  if (!expired.length) return { released: 0 };

  await SeatHold.updateMany(
    { status: "active", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );

  return { released: expired.length };
}
