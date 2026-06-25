/**
 * Shared Express error responder. `logTag` distinguishes which controller
 * logged a given 5xx in server logs; `extra` lets a handful of callers (e.g.
 * ticketAdminController's error.ticket passthrough) add response fields.
 */
export function handleError(res, error, { logTag = "[server]", extra = {} } = {}) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error(logTag, error);
  return res.status(status).json({ error: message, ...extra });
}
