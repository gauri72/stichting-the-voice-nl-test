import { listLoginEvents as listLoginEventsService } from "../services/loginActivityService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin/login-activity]" });
}

export async function listLoginEvents(req, res) {
  try {
    const events = await listLoginEventsService({ search: req.query.search });
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}
