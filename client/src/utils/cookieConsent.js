export const CONSENT_STORAGE_KEY = "voice_cookie_consent_v2";
export const ANONYMOUS_ID_KEY = "voice_consent_id";
export const CONSENT_VERSION = "1.0";

// 12 months, per the consent-expiry requirement.
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

const GA_SCRIPT_ID = "voice-analytics-script";
const HOTJAR_SCRIPT_ID = "voice-hotjar-script";
const MARKETING_SCRIPT_ID = "voice-marketing-script";
const DEFAULT_MEASUREMENT_ID = "G-PV8ZEZVQJ2";

export const COOKIE_CATEGORIES = [
  {
    key: "necessary",
    icon: "✅",
    required: true,
  },
  {
    key: "functional",
    icon: "⚙️",
    required: false,
  },
  {
    key: "analytics",
    icon: "📊",
    required: false,
  },
  {
    key: "marketing",
    icon: "🎯",
    required: false,
  },
];

export const DEFAULT_CATEGORIES = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

export function readStoredConsent() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed?.timestamp || !parsed?.categories) return null;
  if (Date.now() - parsed.timestamp > CONSENT_TTL_MS) return null;

  return {
    categories: { ...DEFAULT_CATEGORIES, ...parsed.categories, necessary: true },
    doNotSell: Boolean(parsed.doNotSell),
    method: parsed.method || "custom",
    timestamp: parsed.timestamp,
    version: parsed.version || CONSENT_VERSION,
  };
}

export function writeStoredConsent({ categories, doNotSell, method }) {
  if (typeof window === "undefined") return null;
  const record = {
    categories: { ...DEFAULT_CATEGORIES, ...categories, necessary: true },
    doNotSell: Boolean(doNotSell),
    method,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearStoredConsent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}

function getMeasurementId() {
  const fromEnv = (import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
  return fromEnv || DEFAULT_MEASUREMENT_ID;
}

function loadAnalyticsScripts() {
  if (typeof window === "undefined") return;

  // Re-enable in case a prior session disabled GA via the opt-out flag below.
  window[`ga-disable-${getMeasurementId()}`] = false;

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const measurementId = getMeasurementId();
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  // Hotjar — only activated if a site ID is configured. No-op placeholder
  // otherwise so this stays a single integration point to fill in later.
  const hotjarId = (import.meta.env.VITE_HOTJAR_SITE_ID || "").trim();
  if (hotjarId && !document.getElementById(HOTJAR_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = HOTJAR_SCRIPT_ID;
    script.async = true;
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${JSON.stringify(hotjarId)},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }
}

function unloadAnalyticsScripts() {
  if (typeof window === "undefined") return;
  // GA's documented opt-out mechanism — stops new hits without needing a reload.
  window[`ga-disable-${getMeasurementId()}`] = true;
  window.dataLayer = [];
}

function loadMarketingScripts() {
  if (typeof window === "undefined") return;
  if (document.getElementById(MARKETING_SCRIPT_ID)) return;

  // Placeholder integration point for ad / retargeting pixels (Meta Pixel,
  // Google Ads, LinkedIn Insight, etc). Only ever called after explicit
  // marketing consent — wire real pixel IDs in here when available.
  const marker = document.createElement("meta");
  marker.id = MARKETING_SCRIPT_ID;
  marker.name = "voice-marketing-consent";
  marker.content = "granted";
  document.head.appendChild(marker);
}

function unloadMarketingScripts() {
  if (typeof window === "undefined") return;
  document.getElementById(MARKETING_SCRIPT_ID)?.remove();
}

export function applyConsentToScripts(categories) {
  if (categories?.analytics) {
    loadAnalyticsScripts();
  } else {
    unloadAnalyticsScripts();
  }

  if (categories?.marketing) {
    loadMarketingScripts();
  } else {
    unloadMarketingScripts();
  }
}

export function initializeCookieConsent() {
  const consent = readStoredConsent();
  if (consent) {
    applyConsentToScripts(consent.categories);
  }
  return consent;
}
