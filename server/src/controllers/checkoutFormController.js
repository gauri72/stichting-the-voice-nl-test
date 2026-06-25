import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[checkout-forms]" });
}

export async function listAdminCheckoutForms(req, res) {
  try {
    const { listCheckoutForms } = await import("../services/checkoutFormService.js");
    const forms = await listCheckoutForms(req.query || {});
    return res.json({ forms });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminStandardCheckoutForms(req, res) {
  try {
    const { listStandardCheckoutForms } = await import("../services/checkoutFormService.js");
    const forms = await listStandardCheckoutForms();
    return res.json({ forms });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAdminCheckoutForm(req, res) {
  try {
    const { createCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await createCheckoutForm(req.body || {}, req.admin?.id || null);
    return res.status(201).json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAdminCheckoutForm(req, res) {
  try {
    const { getCheckoutFormById } = await import("../services/checkoutFormService.js");
    const form = await getCheckoutFormById(req.params.id);
    return res.json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchAdminCheckoutForm(req, res) {
  try {
    const { updateCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await updateCheckoutForm(req.params.id, req.body || {}, req.admin?.id || null);
    return res.json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteAdminCheckoutForm(req, res) {
  try {
    const { deleteCheckoutForm } = await import("../services/checkoutFormService.js");
    const result = await deleteCheckoutForm(req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishAdminCheckoutForm(req, res) {
  try {
    const { publishCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await publishCheckoutForm(req.params.id, req.admin?.id || null);
    return res.json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateAdminCheckoutForm(req, res) {
  try {
    const { duplicateCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await duplicateCheckoutForm(req.params.id, req.admin?.id || null);
    return res.status(201).json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restoreDefaultAdminCheckoutForm(req, res) {
  try {
    const { restoreDefaultCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await restoreDefaultCheckoutForm(req.params.id, req.admin?.id || null);
    return res.json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function archiveAdminCheckoutForm(req, res) {
  try {
    const { archiveCheckoutForm } = await import("../services/checkoutFormService.js");
    const form = await archiveCheckoutForm(req.params.id, req.admin?.id || null);
    return res.json({ form });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function applyAdminCheckoutFormToEvents(req, res) {
  try {
    const { applyCheckoutFormToEvents } = await import("../services/checkoutFormService.js");
    const result = await applyCheckoutFormToEvents(req.params.id, req.body || {}, req.admin?.id || null);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchEventCheckoutForm(req, res) {
  try {
    const { updateEventCheckoutForm } = await import("../services/checkoutFormService.js");
    const result = await updateEventCheckoutForm(req.params.eventId, req.body || {}, req.admin?.id || null);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAdminCheckoutFormResponses(req, res) {
  try {
    const { listCheckoutFormResponses } = await import("../services/checkoutFormService.js");
    const responses = await listCheckoutFormResponses(req.query || {});
    return res.json({ responses });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resolvePublicCheckoutForm(req, res) {
  try {
    const { resolveCheckoutForms } = await import("../services/checkoutFormService.js");
    const data = await resolveCheckoutForms(req.body || {});
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validatePublicCheckoutForm(req, res) {
  try {
    const { validateCheckoutFormAnswers } = await import("../services/checkoutFormService.js");
    const result = await validateCheckoutFormAnswers(req.body || {});
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function savePublicCheckoutFormResponse(req, res) {
  try {
    const { saveCheckoutFormResponse } = await import("../services/checkoutFormService.js");
    const payload = {
      ...(req.body || {}),
      userId: req.user?.id || req.user?._id || null,
    };
    const result = await saveCheckoutFormResponse(payload);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
