import {
  listSubscribers,
  upsertSubscriber,
  deleteSubscriber,
  listEventsForPicker,
  sendCurrentSummaryToAllSubscribers,
} from "../services/eventNotificationSubscriberService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin/event-notifications]" });
}

export async function listAll(req, res) {
  try {
    const subscribers = await listSubscribers();
    return res.status(200).json({ subscribers });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function save(req, res) {
  try {
    const { email, eventIds } = req.body || {};
    const subscriber = await upsertSubscriber(email, eventIds);
    return res.status(200).json({ subscriber });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req, res) {
  try {
    await deleteSubscriber(req.params.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listEvents(req, res) {
  try {
    const events = await listEventsForPicker();
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendSummary(req, res) {
  try {
    const result = await sendCurrentSummaryToAllSubscribers();
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
