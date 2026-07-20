import { listPending, approveItem, rejectItem } from "../services/i18n/translationReviewService.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[admin-i18n-review]", error);
  return res.status(status).json({ error: error.message || "Request failed." });
}

export async function listPendingAdmin(req, res) {
  try {
    const items = await listPending();
    return res.json({ items });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function approveItemAdmin(req, res) {
  try {
    const item = await approveItem(req.params.id, {
      editedText: req.body?.editedText,
      reviewedBy: req.admin?.email || req.admin?.name || "",
    });
    return res.json({ item });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function rejectItemAdmin(req, res) {
  try {
    const item = await rejectItem(req.params.id, {
      reviewedBy: req.admin?.email || req.admin?.name || "",
    });
    return res.json({ item });
  } catch (error) {
    return handleError(res, error);
  }
}
