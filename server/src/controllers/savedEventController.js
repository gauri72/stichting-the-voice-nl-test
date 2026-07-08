import { listSavedEventIds, saveEvent, unsaveEvent, bulkSaveEvents } from "../services/savedEventService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[saved-events]" });
}

export async function getSavedEventIds(req, res) {
  try {
    const eventIds = await listSavedEventIds(req.user.id);
    return res.status(200).json({ eventIds });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postSaveEvent(req, res) {
  try {
    await saveEvent(req.user.id, req.params.eventId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSaveEvent(req, res) {
  try {
    await unsaveEvent(req.user.id, req.params.eventId);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postBulkSaveEvents(req, res) {
  try {
    const eventIds = Array.isArray(req.body?.eventIds) ? req.body.eventIds.slice(0, 100) : [];
    await bulkSaveEvents(req.user.id, eventIds);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}
