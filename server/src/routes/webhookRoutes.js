import { Router } from "express";
import { handleIncomingWebhook } from "../services/smartApiBuilderService.js";

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

export default router;
