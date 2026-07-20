import crypto from "crypto";
import { Router } from "express";
import { handleIncomingWebhook } from "../services/smartApiBuilderService.js";
import { createPendingBatch } from "../services/i18n/translationReviewService.js";
import { notifyAdminOfNewTranslations } from "../services/i18n/i18nReviewMailer.js";
import env from "../config/env.js";

const router = Router();

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[webhook]", error);
  return res.status(status).json({ error: error.message || "Webhook processing failed." });
}

router.post("/custom/:integrationKey", async (req, res) => {
  try {
    const result = await handleIncomingWebhook(req.params.integrationKey, req);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
});

function verifyI18nIngestSecret(req) {
  const expected = env.i18nIngest.secret;
  const provided = req.headers["x-i18n-ingest-secret"] || "";
  if (!expected || !provided) return false;
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(String(provided));
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

router.post("/i18n-batch", async (req, res) => {
  try {
    if (!verifyI18nIngestSecret(req)) {
      return res.status(401).json({ error: "Invalid or missing ingest secret." });
    }
    const { commitSha, items } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items must be a non-empty array." });
    }
    const created = await createPendingBatch(items, commitSha || "");
    await notifyAdminOfNewTranslations(items);
    return res.status(201).json({ created: created.length });
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;
