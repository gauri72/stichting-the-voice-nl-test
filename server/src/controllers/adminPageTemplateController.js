import { listPageTemplates, getPageTemplate, createPageFromTemplate } from "../services/pageTemplateService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[page-templates]" });
}

export async function listPageTemplatesAdmin(req, res) {
  try {
    return res.json({ templates: await listPageTemplates() });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPageTemplateAdmin(req, res) {
  try {
    return res.json(await getPageTemplate(req.params.templateId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPageFromTemplateAdmin(req, res) {
  try {
    const page = await createPageFromTemplate(req.body, req.admin?.id);
    return res.status(201).json(page);
  } catch (error) {
    return handleError(res, error);
  }
}
