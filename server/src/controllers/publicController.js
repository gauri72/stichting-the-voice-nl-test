import env from "../config/env.js";
import { isMailerConfigured } from "../services/smtpTransport.js";
import { listFeaturedEvents } from "../services/featuredEventService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[public]" });
}

export function getPublicSiteConfig(_req, res) {
  res.status(200).json({
    contactEmail: env.org.contactEmail,
    mailConfigured: isMailerConfigured()
  });
}

export async function getFeaturedEvents(req, res) {
  try {
    const events = await listFeaturedEvents(req.query.page);
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}
