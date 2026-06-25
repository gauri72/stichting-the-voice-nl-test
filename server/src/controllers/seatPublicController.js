import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[seat-public]" });
}

export async function getPublicSeatMap(req, res) {
  try {
    const { getSeatAvailability } = await import("../services/seatService.js");
    const checkoutSessionId = req.query.checkoutSessionId || "";
    const data = await getSeatAvailability(req.params.eventId, { checkoutSessionId });
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function holdSeats(req, res) {
  try {
    const { holdSeats } = await import("../services/seatService.js");
    const result = await holdSeats({
      eventId: req.body.eventId,
      seatIds: req.body.seatIds,
      checkoutSessionId: req.body.checkoutSessionId,
      userId: req.user?.id,
      email: req.body.email || req.user?.email,
      holdMinutes: req.body.holdMinutes,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function releaseSeatHold(req, res) {
  try {
    const { releaseSeatHolds } = await import("../services/seatService.js");
    const result = await releaseSeatHolds({
      checkoutSessionId: req.body.checkoutSessionId,
      eventId: req.body.eventId,
      seatIds: req.body.seatIds,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmSeats(req, res) {
  try {
    const { validateSeatsForCheckout } = await import("../services/seatService.js");
    const result = await validateSeatsForCheckout(
      req.body.eventId,
      req.body.seatIds,
      req.body.ticketQuantity,
      req.body.ticketTypeIds || []
    );
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
