const AUTH_INTENT_KEY = "voice_auth_intent";
const AUTH_INTENT_TTL_MS = 30 * 60 * 1000;

export function isSafeInternalReturnPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001F\u007F]/.test(value)
  );
}

export function rememberAuthIntent(destination, journey = "account", context = {}) {
  const safeDestination = isSafeInternalReturnPath(destination) ? destination : "/dashboard";
  if (typeof window === "undefined") return safeDestination;
  try {
    sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify({
      destination: safeDestination,
      journey,
      context,
      createdAt: Date.now(),
    }));
  } catch {
    // Storage can be unavailable in privacy-restricted browsers. The URL still
    // carries the safe destination, so authentication remains functional.
  }
  return safeDestination;
}

export function readAuthIntent() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(AUTH_INTENT_KEY) || "null");
    if (!parsed || Date.now() - Number(parsed.createdAt || 0) > AUTH_INTENT_TTL_MS) {
      sessionStorage.removeItem(AUTH_INTENT_KEY);
      return null;
    }
    if (!isSafeInternalReturnPath(parsed.destination)) {
      sessionStorage.removeItem(AUTH_INTENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuthIntent() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
  } catch {
    // no-op
  }
}

/** Resolve a safe in-app return path from login params, state or saved intent. */
export function getReturnTo(searchParams, locationState) {
  const intent = readAuthIntent();
  const raw =
    searchParams?.get("returnTo") ||
    searchParams?.get("return") ||
    searchParams?.get("callbackUrl") ||
    locationState?.from ||
    intent?.destination ||
    "";

  if (isSafeInternalReturnPath(raw)) {
    return raw;
  }

  return "/dashboard";
}

export function buildLoginUrl(returnTo, options = {}) {
  const safe = rememberAuthIntent(returnTo, options.journey, options.context);
  const params = new URLSearchParams();
  params.set("returnTo", safe);
  if (options.journey) params.set("journey", options.journey);
  return `/my-account?${params.toString()}`;
}

export function buildRegisterUrl(email, returnTo) {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  const safe = rememberAuthIntent(returnTo, "registration", { email: email || "" });
  params.set("returnTo", safe);
  params.set("mode", "signup");
  return `/my-account?${params.toString()}`;
}

export function buildCheckoutReturnPath(eventSlugOrId, checkoutSessionId) {
  const base = `/events/${eventSlugOrId}/tickets`;
  if (!checkoutSessionId) return base;
  return `${base}?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}`;
}
