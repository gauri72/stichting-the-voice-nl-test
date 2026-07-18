import mongoose from "mongoose";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[public-cms]" });
}

function hasDatabaseConnection() {
  return mongoose.connection.readyState === 1;
}

function sendCmsFallback(res) {
  return res.status(404).json({ error: "CMS unavailable; use bundled page content.", fallback: true });
}

export async function getPublicPageContent(req, res) {
  if (!hasDatabaseConnection()) return sendCmsFallback(res);

  try {
    const { getPublicPage } = await import("../services/pageService.js");
    const page = await getPublicPage(req.params.slug);
    if (!page) {
      return res.status(404).json({ error: "No published CMS content.", fallback: true });
    }
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicHeader(req, res) {
  if (!hasDatabaseConnection()) return sendCmsFallback(res);

  try {
    const { getPublicHeader } = await import("../services/siteNavigationService.js");
    const header = await getPublicHeader();
    return res.json(header);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicFooter(req, res) {
  if (!hasDatabaseConnection()) return sendCmsFallback(res);

  try {
    const { getPublicFooter } = await import("../services/siteFooterService.js");
    const footer = await getPublicFooter();
    return res.json(footer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicContentOverrides(req, res) {
  if (!hasDatabaseConnection()) return res.json({});

  try {
    const { getCategorySettings } = await import("../services/settingsService.js");
    const overrides = await getCategorySettings("content_overrides");
    return res.json(overrides);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublicDesignSystem(req, res) {
  if (!hasDatabaseConnection()) return sendCmsFallback(res);

  try {
    const { getPublicDesignSystem } = await import("../services/designSystemService.js");
    const designSystem = await getPublicDesignSystem();
    return res.json(designSystem);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPreviewPageContent(req, res) {
  if (!hasDatabaseConnection()) return sendCmsFallback(res);

  try {
    const { getPreviewPage } = await import("../services/pageService.js");
    const version = req.query.version || "draft";
    const page = await getPreviewPage(req.params.slug, version);
    return res.json(page);
  } catch (error) {
    return handleError(res, error);
  }
}
