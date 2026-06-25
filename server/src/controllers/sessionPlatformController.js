import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[session-platform]" });
}

export async function listPublicSessions(req, res) {
  try {
    const { listPublicSessions } = await import("../services/sessionPlatformService.js");
    const sessions = await listPublicSessions();
    return res.json({ sessions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicSession(req, res) {
  try {
    const { getPublicSessionBySlug } = await import("../services/sessionPlatformService.js");
    const data = await getPublicSessionBySlug(req.params.slug);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPublicSessionBooking(req, res) {
  try {
    const { createPublicSessionBooking } = await import("../services/sessionPlatformService.js");
    const result = await createPublicSessionBooking(req.body, req.user?.id || null);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmPublicSessionBookingPayment(req, res) {
  try {
    const { confirmSessionBookingPayment } = await import("../services/sessionPlatformService.js");
    const result = await confirmSessionBookingPayment(req.body.bookingId, req.body.paymentIntentId);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminSessions(req, res) {
  try {
    const { listAdminSessions } = await import("../services/sessionPlatformService.js");
    const sessions = await listAdminSessions(req.query);
    return res.json({ sessions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminSession(req, res) {
  try {
    const { createSession } = await import("../services/sessionPlatformService.js");
    const session = await createSession(req.body, req.admin?.id || null);
    return res.status(201).json({ session });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchAdminSession(req, res) {
  try {
    const { updateSession } = await import("../services/sessionPlatformService.js");
    const session = await updateSession(req.params.id, req.body, req.admin?.id || null);
    return res.json({ session });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminSessionSlots(req, res) {
  try {
    const { listSessionSlots } = await import("../services/sessionPlatformService.js");
    const slots = await listSessionSlots(req.params.sessionId);
    return res.json({ slots });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminSessionSlot(req, res) {
  try {
    const { createSessionSlot } = await import("../services/sessionPlatformService.js");
    const slot = await createSessionSlot(req.params.sessionId, req.body);
    return res.status(201).json({ slot });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminRecurringSessionSlots(req, res) {
  try {
    const { createRecurringSessionSlots } = await import("../services/sessionPlatformService.js");
    const slots = await createRecurringSessionSlots(req.params.sessionId, req.body);
    return res.status(201).json({ slots });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function blockAdminSessionDate(req, res) {
  try {
    const { blockSessionDate } = await import("../services/sessionPlatformService.js");
    const result = await blockSessionDate(req.params.sessionId, req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminSessionBookings(req, res) {
  try {
    const { listAdminSessionBookings } = await import("../services/sessionPlatformService.js");
    const bookings = await listAdminSessionBookings(req.query);
    return res.json({ bookings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchAdminSessionBooking(req, res) {
  try {
    const { updateSessionBooking } = await import("../services/sessionPlatformService.js");
    const booking = await updateSessionBooking(req.params.id, req.body);
    return res.json({ booking });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminResources(req, res) {
  try {
    const { listResources } = await import("../services/sessionPlatformService.js");
    const resources = await listResources(req.query);
    return res.json({ resources });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminResource(req, res) {
  try {
    const { createResource } = await import("../services/sessionPlatformService.js");
    const resource = await createResource(req.body);
    return res.status(201).json({ resource });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminRsvpEvents(req, res) {
  try {
    const { listAdminRsvpEvents } = await import("../services/sessionPlatformService.js");
    const events = await listAdminRsvpEvents();
    return res.json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminRsvpEvent(req, res) {
  try {
    const { createRsvpEvent } = await import("../services/sessionPlatformService.js");
    const event = await createRsvpEvent(req.body, req.admin?.id || null);
    return res.status(201).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicRsvp(req, res) {
  try {
    const { getPublicRsvpEvent } = await import("../services/sessionPlatformService.js");
    const event = await getPublicRsvpEvent(req.params.slug);
    return res.json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function submitPublicRsvp(req, res) {
  try {
    const { submitRsvpResponse } = await import("../services/sessionPlatformService.js");
    const response = await submitRsvpResponse(req.params.slug, req.body);
    return res.status(201).json({ response });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminRsvps(req, res) {
  try {
    const { listAdminRsvpResponses } = await import("../services/sessionPlatformService.js");
    const responses = await listAdminRsvpResponses(req.query);
    return res.json({ responses });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchAdminRsvp(req, res) {
  try {
    const { updateAdminRsvpResponse } = await import("../services/sessionPlatformService.js");
    const response = await updateAdminRsvpResponse(req.params.slug, req.params.id, req.body);
    return res.json({ response });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteAdminRsvp(req, res) {
  try {
    const { deleteAdminRsvpResponse } = await import("../services/sessionPlatformService.js");
    const result = await deleteAdminRsvpResponse(req.params.slug, req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSessionBookingPdf(req, res) {
  try {
    const { getSessionBookingPdfBuffer } = await import("../services/sessionPlatformService.js");
    const token = req.query.token || req.query.verificationToken || "";
    const buffer = await getSessionBookingPdfBuffer(req.params.bookingId, token);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="session-booking-${req.params.bookingId}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRsvpResponsePdf(req, res) {
  try {
    const { getRsvpResponsePdfBuffer } = await import("../services/sessionPlatformService.js");
    const token = req.query.token || req.query.verificationToken || "";
    const buffer = await getRsvpResponsePdfBuffer(req.params.slug, req.params.responseId, token);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="rsvp-${req.params.responseId}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAdminSessionAnalytics(req, res) {
  try {
    const { getSessionAnalytics } = await import("../services/sessionPlatformService.js");
    const analytics = await getSessionAnalytics();
    return res.json({ analytics });
  } catch (error) {
    return handleError(res, error);
  }
}
