export const COOKIE_CONSENT_KEY = "voice-cookie-consent";

const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";
const GA_SCRIPT_ID = "voice-analytics-script";
const DEFAULT_MEASUREMENT_ID = "G-PV8ZEZVQJ2";

function getMeasurementId() {
  const fromEnv = (import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
  return fromEnv || DEFAULT_MEASUREMENT_ID;
}

export function readCookieConsent() {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === CONSENT_ACCEPTED || value === CONSENT_REJECTED ? value : null;
}

export function saveCookieConsent(value) {
  if (typeof window === "undefined") return;
  if (value !== CONSENT_ACCEPTED && value !== CONSENT_REJECTED) return;
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

function injectGoogleAnalytics() {
  if (typeof window === "undefined") return;
  if (document.getElementById(GA_SCRIPT_ID)) return;

  const measurementId = getMeasurementId();
  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

export function applyCookieConsent(value) {
  saveCookieConsent(value);
  if (value === CONSENT_ACCEPTED) {
    injectGoogleAnalytics();
  }
}

export function initializeCookieConsent() {
  const consent = readCookieConsent();
  if (consent === CONSENT_ACCEPTED) {
    injectGoogleAnalytics();
  }
}
