import {
  getGlobalSettings,
  updateGlobalSettings,
  addPrebuiltPrompt,
  deletePrebuiltPrompt,
  getCustomerOverride,
  setCustomerOverride,
  listCustomerUsage,
  listScheduledRunLogs,
  getDashboardStats,
} from "../services/adminAiAssistantSettingsService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-personal-ai]" });
}

export async function getSettings(req, res) {
  try {
    const settings = await getGlobalSettings();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchSettings(req, res) {
  try {
    const settings = await updateGlobalSettings(req.body);
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postPrebuiltPrompt(req, res) {
  try {
    const { text, category } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "Prompt text is required." });
    const settings = await addPrebuiltPrompt(text.trim(), category);
    return res.status(201).json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removePrebuiltPrompt(req, res) {
  try {
    const settings = await deletePrebuiltPrompt(req.params.promptId);
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOverride(req, res) {
  try {
    const override = await getCustomerOverride(req.params.customerId);
    return res.json({ override });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function putOverride(req, res) {
  try {
    const override = await setCustomerOverride(req.params.customerId, req.body);
    return res.json({ override });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUsageList(req, res) {
  try {
    const usage = await listCustomerUsage(req.query);
    return res.json({ usage });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRunLogs(req, res) {
  try {
    const logs = await listScheduledRunLogs();
    return res.json({ logs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getStats(req, res) {
  try {
    const stats = await getDashboardStats();
    return res.json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}
