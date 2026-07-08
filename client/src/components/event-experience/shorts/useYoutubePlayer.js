import { useCallback, useEffect, useRef, useState } from "react";
import { loadYoutubeIframeApi } from "../shared/useYoutubeIframeApi.js";

/**
 * Mounts/tears down a single YT.Player bound to a leaf <div ref>. Shared by
 * the Shorts hover-preview, the lightbox, and (Phase 6) the admin
 * duration-probe — written once, reused everywhere a player is needed.
 * Never mounts unless `enabled` is true, satisfying the "never load the
 * iframe until hovered/clicked" performance requirement.
 */
export default function useYoutubePlayer({ videoId, enabled, muted = true, showControls = false, onReady } = {}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled || !videoId || !containerRef.current) return undefined;
    let destroyed = false;

    loadYoutubeIframeApi().then((YT) => {
      if (destroyed || !YT || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          controls: showControls ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            setIsReady(true);
            onReady?.(e.target);
          },
        },
      });
    });

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* iframe/player already gone */
      }
      playerRef.current = null;
      setIsReady(false);
    };
  }, [enabled, videoId, muted, showControls, onReady]);

  const mute = useCallback(() => playerRef.current?.mute?.(), []);
  const unMute = useCallback(() => playerRef.current?.unMute?.(), []);
  const getDuration = useCallback(() => playerRef.current?.getDuration?.() ?? 0, []);

  return { containerRef, isReady, mute, unMute, getDuration };
}
