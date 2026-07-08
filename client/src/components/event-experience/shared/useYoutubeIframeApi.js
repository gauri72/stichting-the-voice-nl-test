// Idempotent singleton loader for the YouTube IFrame API script. Every
// consumer (Shorts carousel hover-preview, lightbox, and the Phase 6 admin
// duration-probe) calls this same function — the script is only ever
// injected once, and concurrent callers all share the same pending promise.
let apiPromise = null;

export function loadYoutubeIframeApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
}
