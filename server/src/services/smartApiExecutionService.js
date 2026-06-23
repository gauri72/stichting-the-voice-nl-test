import { REQUEST_TIMEOUT_MS, RATE_LIMIT_PER_MINUTE } from "../config/smartApiConfig.js";
import { sanitizeHeaders } from "../utils/smartApiSecurity.js";

const rateBuckets = new Map();

export function checkRateLimit(integrationId) {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = rateBuckets.get(integrationId) || [];
  const recent = bucket.filter((ts) => now - ts < windowMs);
  if (recent.length >= RATE_LIMIT_PER_MINUTE) {
    const err = new Error("Rate limit exceeded for this integration. Try again shortly.");
    err.status = 429;
    throw err;
  }
  recent.push(now);
  rateBuckets.set(integrationId, recent);
}

function buildUrlWithQuery(url, queryParams = {}) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(queryParams || {})) {
    if (value === undefined || value === null || value === "") continue;
    parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
}

export async function executeApiRequest({ method = "GET", url, headers = {}, queryParams = {}, body = "" }) {
  const finalUrl = buildUrlWithQuery(url, queryParams);
  const safeHeaders = sanitizeHeaders(headers);
  const upperMethod = String(method || "GET").toUpperCase();

  const init = {
    method: upperMethod,
    headers: safeHeaders,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (!["GET", "HEAD"].includes(upperMethod) && body) {
    if (!safeHeaders["Content-Type"] && !safeHeaders["content-type"]) {
      init.headers["Content-Type"] = "application/json";
    }
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(finalUrl, init);
  const bodyText = await response.text();

  let parsedBody = bodyText;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    // keep text
  }

  const responseHeaders = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    bodyText,
    parsedBody,
  };
}
