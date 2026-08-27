import { handleError } from "../utils/handleError.js";

function adminId(req) {
  return req.admin?.id || req.admin?._id || null;
}

export async function listVipGuests(req, res) {
  try {
    const { listVipGuestsForEvent } = await import("../services/vipPassService.js");
    const guests = await listVipGuestsForEvent(req.query.eventId);
    return res.status(200).json({ guests });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createVipGuest(req, res) {
  try {
    const { issueVipPass } = await import("../services/vipPassService.js");
    const result = await issueVipPass(req.body || {}, adminId(req));
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function bulkCreateVipGuests(req, res) {
  try {
    const { bulkIssueVipPasses } = await import("../services/vipPassService.js");
    const result = await bulkIssueVipPasses(req.body || {}, adminId(req));
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendVipGuestPass(req, res) {
  try {
    const { resendVipPass } = await import("../services/vipPassService.js");
    const result = await resendVipPass(req.params.ticketId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function voidVipGuestPass(req, res) {
  try {
    const { voidVipPass } = await import("../services/vipPassService.js");
    const ticket = await voidVipPass(req.params.ticketId, adminId(req), req.body?.reason);
    return res.status(200).json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getVipPassTheme(req, res) {
  try {
    const { getVipPassTheme } = await import("../services/vipPassService.js");
    const theme = await getVipPassTheme(req.params.eventId);
    return res.status(200).json({ theme });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateVipPassTheme(req, res) {
  try {
    const { updateVipPassTheme } = await import("../services/vipPassService.js");
    const theme = await updateVipPassTheme(req.params.eventId, req.body || {});
    return res.status(200).json({ theme });
  } catch (error) {
    return handleError(res, error);
  }
}
