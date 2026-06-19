/**
 * Resolve a safe in-app return path from login query params or router state.
 */
export function getReturnTo(searchParams, locationState) {
  const raw =
    searchParams?.get("returnTo") ||
    searchParams?.get("callbackUrl") ||
    locationState?.from ||
    "";

  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

  return "/dashboard";
}

export function buildLoginUrl(returnTo) {
  const safe = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  return `/my-account?returnTo=${encodeURIComponent(safe)}`;
}

export function buildRegisterUrl(email, returnTo) {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  const safe = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  params.set("returnTo", safe);
  params.set("mode", "signup");
  return `/my-account?${params.toString()}`;
}

export function buildCheckoutReturnPath(eventSlugOrId, checkoutSessionId) {
  const base = `/events/${eventSlugOrId}/tickets`;
  if (!checkoutSessionId) return base;
  return `${base}?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}`;
}
