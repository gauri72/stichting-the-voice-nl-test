import {
  getEventHighlightById,
  listAdminEventHighlights,
  listPublicEventHighlights,
  patchEventHighlight,
  previewYoutubeUrl,
  trackEventHighlightMetric,
  getEventHighlightAnalyticsReport,
} from "../services/eventHighlightService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[event-highlights]" });
}

export async function getPublicEventHighlights(req, res) {
  try {
    const highlights = await listPublicEventHighlights(req.query);
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
    return res.status(200).json({ highlights });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listHighlightsAdmin(req, res) {
  try {
    const highlights = await listAdminEventHighlights(req.query);
    return res.status(200).json({ highlights });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getHighlightAdmin(req, res) {
  try {
    const data = await getEventHighlightById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchHighlightAdmin(req, res) {
  try {
    const data = await patchEventHighlight(req.params.id, req.body || {});
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewYoutubeAdmin(req, res) {
  try {
    const url = req.body?.url || req.body?.youtubeHighlightUrl || "";
    const preview = previewYoutubeUrl(url);
    return res.status(200).json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadHighlightThumbnailAdmin(req, res) {
  try {
    const { highlightThumbnailImageUrl } = req.body || {};
    if (!highlightThumbnailImageUrl) {
      return res.status(400).json({ error: "Thumbnail image data is required." });
    }
    const data = await patchEventHighlight(req.params.id, { highlightThumbnailImageUrl });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function trackPublicHighlightMetric(req, res) {
  try {
    const { eventId, action, completionRate } = req.body || {};
    const result = await trackEventHighlightMetric(eventId, action, { completionRate });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getHighlightAnalyticsAdmin(req, res) {
  try {
    const report = await getEventHighlightAnalyticsReport();
    return res.status(200).json(report);
  } catch (error) {
    return handleError(res, error);
  }
}
