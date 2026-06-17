import { useEffect, useRef } from "react";
import { isTurnstileEnabled } from "../../utils/captcha.js";
import "../../styles/turnstile-widget.css";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";

let scriptPromise = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

function getTurnstileTheme() {
  if (typeof document === "undefined") return "auto";
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return "auto";
}

export default function TurnstileWidget({ onVerify, onExpire, onError, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return undefined;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current != null) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: getTurnstileTheme(),
          callback: (value) => onVerify?.(value),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onError?.(),
        });
      })
      .catch(() => onError?.());

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [resetKey, onVerify, onExpire, onError]);

  if (!isTurnstileEnabled()) return null;

  return (
    <div
      ref={containerRef}
      className="turnstile-widget"
      aria-label="Security verification"
    />
  );
}

export { isTurnstileEnabled };
