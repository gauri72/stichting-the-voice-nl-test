import { useEffect, useRef, useState } from "react";

/** Same file as tab favicon (`public/favicon.png`) so the browser can reuse one small request. */
const SPLASH_LOGO_SRC = `${import.meta.env.BASE_URL}favicon.png`;

const MIN_MS = 650;
const FADE_MS = 480;

export default function AppSplash() {
  const [phase, setPhase] = useState("show");
  const startedFade = useRef(false);

  useEffect(() => {
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
    }

    return () => {
      window.removeEventListener("load", finish);
    };
  }, []);

  useEffect(() => {
    if (phase !== "fade") return undefined;
    const t = window.setTimeout(() => {
      setPhase("gone");
      document.documentElement.classList.remove("splash-open");
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

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
            width={64}
            height={64}
            decoding="sync"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  );
}
