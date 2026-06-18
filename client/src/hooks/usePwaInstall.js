import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPwaVariantForPath, isStandalonePwa } from "../pwa/manifestConfig.js";

export function usePwaInstall(expectedVariant = null) {
  const { pathname } = useLocation();
  const activeVariant = getPwaVariantForPath(pathname);
  const matches = !expectedVariant || expectedVariant === activeVariant;

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalonePwa());

  useEffect(() => {
    if (!matches) {
      setDeferredPrompt(null);
    }
  }, [matches]);

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
