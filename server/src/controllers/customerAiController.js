import {
  isAiAssistantConfigured,
  streamChatReply,
  getChatHistory,
  getChatSession,
  listSavedPrompts,
  createSavedPrompt,
  updateSavedPrompt,
  deleteSavedPrompt,
  listScheduledPrompts,
  createScheduledPrompt,
  updateScheduledPrompt,
  deleteScheduledPrompt,
  listResultsForCustomer,
  getUsageStats,
  savePushSubscription,
} from "../services/aiAssistantService.js";
import { getVapidPublicKey, isPushConfigured } from "../services/webPushService.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[ai-assistant]", error);
  return res.status(status).json({ error: error.message || "Request failed." });
}

export async function getStatus(req, res) {
  return res.json({
    configured: isAiAssistantConfigured(),
    pushConfigured: isPushConfigured(),
    vapidPublicKey: getVapidPublicKey(),
  });
}

export async function postChat(req, res) {
  try {
    const { sessionId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    await streamChatReply(req.user, sessionId, message.trim(), res);
  } catch (error) {
    if (res.headersSent) {
      res.write(JSON.stringify({ type: "error", message: error.message }) + "\n");
      return res.end();
    }
    return handleError(res, error);
  }
}

export async function getChatHistoryList(req, res) {
  try {
    const sessions = await getChatHistory(req.user.id);
    return res.json({ sessions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getChatSessionDetail(req, res) {
  try {
    const session = await getChatSession(req.user.id, req.params.id);
    if (!session) return res.status(404).json({ error: "Chat session not found." });
    return res.json({ session });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPrompts(req, res) {
  try {
    const data = await listSavedPrompts(req.user.id);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postPrompt(req, res) {
  try {
    const { promptText, category } = req.body;
    if (!promptText || !promptText.trim()) {
      return res.status(400).json({ error: "Prompt text is required." });
    }
    const prompt = await createSavedPrompt(req.user.id, { promptText: promptText.trim(), category });
    return res.status(201).json({ prompt });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchPrompt(req, res) {
  try {
    const prompt = await updateSavedPrompt(req.user.id, req.params.id, req.body);
    return res.json({ prompt });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deletePrompt(req, res) {
  try {
    await deleteSavedPrompt(req.user.id, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSchedules(req, res) {
  try {
    const schedules = await listScheduledPrompts(req.user.id);
    return res.json({ schedules });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postSchedule(req, res) {
  try {
    const { promptText, schedule, deliveryMethod } = req.body;
    if (!promptText || !promptText.trim()) {
      return res.status(400).json({ error: "Prompt text is required." });
    }
    if (!schedule || !schedule.type) {
      return res.status(400).json({ error: "A valid schedule is required." });
    }
    const created = await createScheduledPrompt(req.user.id, { promptText: promptText.trim(), schedule, deliveryMethod });
    return res.status(201).json({ schedule: created });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function putSchedule(req, res) {
  try {
    const updated = await updateScheduledPrompt(req.user.id, req.params.id, req.body);
    return res.json({ schedule: updated });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSchedule(req, res) {
  try {
    await deleteScheduledPrompt(req.user.id, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getResults(req, res) {
  try {
    const results = await listResultsForCustomer(req.user.id);
    return res.json({ results });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUsage(req, res) {
  try {
    const usage = await getUsageStats(req.user.id);
    return res.json({ usage });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postPushSubscribe(req, res) {
  try {
    const { endpoint, keys } = req.body.subscription || req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "A valid push subscription is required." });
    }
    await savePushSubscription(req.user.id, { endpoint, keys });
    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}
