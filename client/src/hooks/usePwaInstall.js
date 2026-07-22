import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPwaVariantForPath, isStandalonePwa } from "../pwa/manifestConfig.js";

export function usePwaInstall(expectedVariant = null) {
  const { pathname } = useLocation();
  const activeVariant = getPwaVariantForPath(pathname);
  const matches = !expectedVariant || expectedVariant === activeVariant;

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalonePwa());

  // Deliberately NOT clearing deferredPrompt when `matches` goes false (e.g.
  // navigating from the main site to /check-in, which has its own PWA
  // variant) — the browser only fires beforeinstallprompt once per session,
  // so discarding it here would permanently lose a valid one-tap install
  // opportunity the moment a visitor crosses between variants, even though
  // it's still perfectly usable once they're back on a matching page.
  // `canInstall` below already gates on `matches`, so a mismatched button
  // just doesn't advertise it as available — it isn't thrown away.
  useEffect(() => {
    function onBeforeInstall(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt || !matches) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt, matches]);

  return {
    canInstall: matches && Boolean(deferredPrompt) && !installed,
    installed,
    promptInstall,
    activeVariant,
  };
}
