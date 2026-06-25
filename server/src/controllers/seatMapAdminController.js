import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[seat-map-admin]" });
}

export async function getSeatMap(req, res) {
  try {
    const { getOrCreateSeatMap, listSeatsForEvent } = await import("../services/seatService.js");
    const eventId = req.params.eventId;
    const seatMap = await getOrCreateSeatMap(eventId, req.admin?.id);
    const seats = await listSeatsForEvent(eventId);
    return res.json({ seatMap, seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchSeatMap(req, res) {
  try {
    const { updateSeatMap } = await import("../services/seatService.js");
    const seatMap = await updateSeatMap(req.params.eventId, req.body, req.admin?.id);
    return res.json({ seatMap });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadSeatMapImage(req, res) {
  try {
    const { updateSeatMap } = await import("../services/seatService.js");
    const { processPageImageUpload } = await import("../services/pageImageService.js");
    const { imageData, imageWidth, imageHeight } = req.body;
    if (imageData) {
      await processPageImageUpload({ imageData, imageType: "seat_map" }, req.admin?.id);
    }
    const seatMap = await updateSeatMap(
      req.params.eventId,
      { imageUrl: imageData, imageWidth, imageHeight },
      req.admin?.id
    );
    return res.json({ seatMap });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listSeats(req, res) {
  try {
    const { listSeatsForEvent } = await import("../services/seatService.js");
    const seats = await listSeatsForEvent(req.params.eventId);
    return res.json({ seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createSeat(req, res) {
  try {
    const { createSeat } = await import("../services/seatService.js");
    const seat = await createSeat(req.params.eventId, req.body, req.admin?.id);
    return res.status(201).json({ seat });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchSeat(req, res) {
  try {
    const { updateSeat } = await import("../services/seatService.js");
    const seat = await updateSeat(req.params.eventId, req.params.seatId, req.body, req.admin?.id);
    return res.json({ seat });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSeat(req, res) {
  try {
    const { deleteSeat } = await import("../services/seatService.js");
    const result = await deleteSeat(req.params.eventId, req.params.seatId, req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function bulkCreateSeats(req, res) {
  try {
    const { bulkCreateSeats } = await import("../services/seatService.js");
    const seats = await bulkCreateSeats(req.params.eventId, req.body, req.admin?.id);
    return res.status(201).json({ seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function repositionSeats(req, res) {
  try {
    const { repositionSeats } = await import("../services/seatService.js");
    const seats = await repositionSeats(req.params.eventId, req.body.positions, req.admin?.id);
    return res.json({ seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function blockSeats(req, res) {
  try {
    const { blockSeats } = await import("../services/seatService.js");
    const seats = await blockSeats(req.params.eventId, req.body.seatIds || [], req.admin?.id);
    return res.json({ seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function unblockSeats(req, res) {
  try {
    const { unblockSeats } = await import("../services/seatService.js");
    const seats = await unblockSeats(req.params.eventId, req.body.seatIds || [], req.admin?.id);
    return res.json({ seats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changeTicketSeat(req, res) {
  try {
    const { changeTicketSeat } = await import("../services/seatService.js");
    const ticket = await changeTicketSeat(req.params.ticketId, req.body.newSeatId, req.admin?.id);
    return res.json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function releaseTicketSeat(req, res) {
  try {
    const Ticket = (await import("../models/Ticket.js")).default;
    const Seat = (await import("../models/Seat.js")).default;
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    if (ticket.seatId) {
      await Seat.updateOne({ seatId: ticket.seatId }, { $set: { status: "available" } });
      ticket.seatId = "";
      ticket.section = "";
      ticket.row = "";
      ticket.seatNumber = "";
      ticket.seatLabel = "";
      await ticket.save();
    }
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}
