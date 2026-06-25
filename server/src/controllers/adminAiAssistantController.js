import { runAiAction, isAiAssistantConfigured, AI_ACTIONS } from "../services/aiContentAssistantService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[ai-assistant]" });
}

export async function getAiAssistantStatusAdmin(req, res) {
  return res.json({ configured: isAiAssistantConfigured(), actions: Object.keys(AI_ACTIONS) });
}

export async function runAiActionAdmin(req, res) {
  try {
    const result = await runAiAction(req.body?.action, req.body?.text);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
