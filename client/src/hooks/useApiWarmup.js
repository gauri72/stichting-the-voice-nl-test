import { useEffect } from "react";
import { apiUrl } from "../utils/api.js";

const WARMUP_DELAYS_MS = [0, 3000, 8000, 15000];
const HAS_SEPARATE_API_HOST = Boolean((import.meta.env.VITE_API_BASE_URL || "").trim());

/**
 * Pings the API the moment a checkout/payment block mounts, in case the
 * visitor jumped straight here (deep link) and bypassed any page-level
 * warm-up. Retries with backoff so a missed first ping during a free-tier
 * host's cold start is recovered before the visitor submits the form.
 * No-ops when the API is same-origin (nothing separate to wake up).
 */
export function useApiWarmup() {
  useEffect(() => {
    if (!HAS_SEPARATE_API_HOST) return;
    const controller = new AbortController();
    (async () => {
      const url = apiUrl("/api/health");
      for (const delay of WARMUP_DELAYS_MS) {
        if (controller.signal.aborted) return;
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
          if (controller.signal.aborted) return;
        }
        try {
          const res = await fetch(url, { method: "GET", signal: controller.signal, cache: "no-store" });
          if (res.ok) return;
        } catch (_err) {
          // Try again after the next backoff window.
        }
      }
    })();
    return () => controller.abort();
  }, []);
}
