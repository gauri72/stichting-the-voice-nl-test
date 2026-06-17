export const CAPTCHA_REQUIRED_MESSAGE = "Please complete the security check before continuing.";
export const CAPTCHA_UNAVAILABLE_MESSAGE =
  "Security verification is unavailable right now. Please try again later.";

export function isTurnstileEnabled() {
  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim());
}
