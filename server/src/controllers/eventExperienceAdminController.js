import {
  previewYoutubeShort,
  getEventShortFields,
  updateEventShortFields,
} from "../services/eventExperienceAdminService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[event-experience-admin]" });
}

export async function getEventShortAdmin(req, res) {
  try {
    const data = await getEventShortFields(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewYoutubeShortAdmin(req, res) {
  try {
    const url = req.body?.url || req.body?.youtubeShortUrl || "";
    const preview = previewYoutubeShort(url);
    return res.status(200).json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchEventShortAdmin(req, res) {
  try {
    const data = await updateEventShortFields(req.params.id, req.body || {});
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
