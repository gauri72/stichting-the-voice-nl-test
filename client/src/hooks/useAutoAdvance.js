import { useEffect } from "react";

/**
 * Calls `advance` on a fixed interval. Pauses automatically whenever
 * `enabled` is false (e.g. fewer than 2 slides, or the carousel is
 * hovered/focused) and always clears the timer on unmount or re-run.
 */
export function useAutoAdvance(advance, { enabled = true, intervalMs } = {}) {
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(advance, intervalMs);
    return () => window.clearInterval(timer);
  }, [advance, enabled, intervalMs]);
}
