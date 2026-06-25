import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, authHeaders } from "../utils/api.js";
import {
  DEFAULT_CATEGORIES,
  applyConsentToScripts,
  getOrCreateAnonymousId,
  readStoredConsent,
  writeStoredConsent,
} from "../utils/cookieConsent.js";

const CookieConsentContext = createContext(null);

function postConsentToServer({ categories, doNotSell, method }) {
  const body = {
    anonymousId: getOrCreateAnonymousId(),
    categories,
    doNotSell,
    method,
  };

  apiFetch("/api/consent", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).catch(() => {
    // Consent is already saved locally and applied to scripts; the audit
    // log call is best-effort and must never block the user's choice.
  });
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readStoredConsent());
  const [showBanner, setShowBanner] = useState(() => !readStoredConsent());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (consent) {
      applyConsentToScripts(consent.categories);
    }
  }, [consent]);

  const commitConsent = useCallback(({ categories, doNotSell = false, method }) => {
    const record = writeStoredConsent({ categories, doNotSell, method });
    setConsent(record);
    setShowBanner(false);
    setShowModal(false);
    applyConsentToScripts(record.categories);
    postConsentToServer({ categories: record.categories, doNotSell: record.doNotSell, method });
    return record;
  }, []);

  const acceptAll = useCallback(
    () =>
      commitConsent({
        categories: { necessary: true, functional: true, analytics: true, marketing: true },
        doNotSell: false,
        method: "accept_all",
      }),
    [commitConsent]
  );

  const rejectAll = useCallback(
    () =>
      commitConsent({
        categories: { ...DEFAULT_CATEGORIES },
        doNotSell: true,
        method: "reject_all",
      }),
    [commitConsent]
  );

  const savePreferences = useCallback(
    (categories, doNotSell = false) =>
      commitConsent({ categories, doNotSell, method: "custom" }),
    [commitConsent]
  );

  const openPreferences = useCallback(() => setShowModal(true), []);
  const closePreferences = useCallback(() => setShowModal(false), []);

  const value = useMemo(
    () => ({
      consent,
      categories: consent?.categories || DEFAULT_CATEGORIES,
      doNotSell: consent?.doNotSell || false,
      hasResponded: Boolean(consent),
      showBanner,
      showModal,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      showBanner,
      showModal,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    ]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
