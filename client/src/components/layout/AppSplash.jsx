import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Same file as tab favicon (`public/favicon.png`) so the browser can reuse one small request. */
const SPLASH_LOGO_SRC = `${import.meta.env.BASE_URL}favicon.png`;

const MIN_MS = 650;
const FADE_MS = 480;

export default function AppSplash({ disabled = false }) {
  const { t } = useTranslation(["common"]);
  const [phase, setPhase] = useState(disabled ? "gone" : "show");
  const startedFade = useRef(disabled);

  useEffect(() => {
    if (disabled) {
      document.documentElement.classList.remove("splash-open");
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) return undefined;
    const splashFailsafe = window.setTimeout(() => {
      document.documentElement.classList.remove("splash-open");
      startedFade.current = true;
      setPhase("gone");
    }, 4000);

    const start = performance.now();

    const finish = () => {
      if (startedFade.current) return;
      const elapsed = performance.now() - start;
      const rest = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(() => {
        if (startedFade.current) return;
        startedFade.current = true;
        setPhase("fade");
      }, rest);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Do not wait forever for third-party scripts (e.g. Google GSI) to finish loading.
      window.addEventListener("DOMContentLoaded", finish, { once: true });
    }

    return () => {
      window.clearTimeout(splashFailsafe);
      window.removeEventListener("load", finish);
      window.removeEventListener("DOMContentLoaded", finish);
    };
  }, [disabled]);

  useEffect(() => {
    if (phase !== "fade") return undefined;
    const fadeTimeout = window.setTimeout(() => {
      setPhase("gone");
      document.documentElement.classList.remove("splash-open");
    }, FADE_MS);
    return () => window.clearTimeout(fadeTimeout);
  }, [phase]);

  if (disabled || phase === "gone") return null;

  return (
    <div
      className={`app-splash ${phase === "fade" ? "app-splash--fade" : ""}`}
      aria-busy={phase === "show"}
      aria-live="polite"
    >
      <div className="app-splash__inner">
        <div className="app-splash__logo-wrap" aria-hidden>
          <div className="app-splash__ring" />
          <img
            className="app-splash__logo"
            src={SPLASH_LOGO_SRC}
            alt=""
            width={80}
            height={80}
            decoding="sync"
            fetchPriority="high"
          />
        </div>
        <span className="visually-hidden">{t("common:appSplash.loading")}</span>
      </div>
    </div>
  );
}
