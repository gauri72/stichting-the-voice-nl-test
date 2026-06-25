import {
  getAdminDesignSystem,
  updateDesignSystemDraft,
  publishDesignSystem,
} from "../services/designSystemService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[design-system]" });
}

export async function getDesignSystemAdmin(req, res) {
  try {
    const data = await getAdminDesignSystem();
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDesignSystemAdmin(req, res) {
  try {
    const data = await updateDesignSystemDraft(req.body, req.admin?.id);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishDesignSystemAdmin(req, res) {
  try {
    const data = await publishDesignSystem(req.admin?.id);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
