import { listPending, approveItem, rejectItem } from "../services/i18n/translationReviewService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-i18n-review]" });
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
