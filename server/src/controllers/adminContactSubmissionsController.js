import { handleError } from "../utils/handleError.js";

export async function listVolunteerApplications(req, res) {
  try {
    const { listVolunteerApplications } = await import("../services/adminContactSubmissionsService.js");
    const applications = await listVolunteerApplications({ search: req.query.search });
    return res.status(200).json({ applications });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listVentureStudioMessages(req, res) {
  try {
    const { listVentureStudioMessages } = await import("../services/adminContactSubmissionsService.js");
    const messages = await listVentureStudioMessages({ search: req.query.search });
    return res.status(200).json({ messages });
  } catch (error) {
    return handleError(res, error);
  }
}
