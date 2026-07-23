/**
 * Shared Express error responder. `logTag` distinguishes which controller
 * logged a given 5xx in server logs; `extra` lets a handful of callers (e.g.
 * ticketAdminController's error.ticket passthrough) add response fields.
 */
export function handleError(res, error, { logTag = "[server]", extra = {} } = {}) {
  const status = error.status || 500;
  // Every intentional app error sets a 4xx status with a deliberate
  // user-facing message. Anything that falls through to 500 is unexpected
  // (a Mongoose CastError/ValidationError, a bug) and its raw message can
  // leak schema/field names — so 5xx always gets a generic message instead.
  const message = status >= 500 ? "Something went wrong. Please try again later." : (error.message || "Something went wrong.");
  if (status >= 500) console.error(logTag, error);
  return res.status(status).json({ error: message, ...extra });
}
