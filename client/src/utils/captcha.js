export const CAPTCHA_REQUIRED_MESSAGE = "Please complete the security check before continuing.";
export const CAPTCHA_UNAVAILABLE_MESSAGE =
  "Security verification is unavailable right now. Please try again later.";

export function isTurnstileEnabled() {
  const allowLocal = import.meta.env.VITE_ALLOW_TURNSTILE_LOCAL === "true";
  if (!allowLocal && typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
    return false;
  }
  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim());
}
