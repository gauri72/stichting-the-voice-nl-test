import { useEffect } from "react";
import SponsorshipBreadcrumbSection from "./SponsorshipBreadcrumbSection";
import SponsorshipTiersSection from "./SponsorshipTiersSection";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// Free-tier hosts (e.g. Render) idle the API after ~15 min and then take
// 10-30 s to start listening again. Ping /api/health on page mount and retry
// a few times so a missed first ping during the boot window does not waste
// the warm-up. Each successful ping logs to the console, which makes it easy
// to verify that the warm-up is working in DevTools.
async function warmUpApi(signal) {
  if (!API_BASE) return;
  const url = `${API_BASE}/api/health`;
  const attempts = [0, 3000, 8000, 15000];
  for (const delay of attempts) {
    if (signal.aborted) return;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (signal.aborted) return;
    }
    try {
      const res = await fetch(url, {
        method: "GET",
        signal,
        cache: "no-store"
      });
      if (res.ok) {
        console.info("[warm-up] API is awake");
        return;
      }
    } catch (_err) {
      // Try again after the next backoff window.
    }
  }
  console.warn("[warm-up] API did not respond after retries");
}

export default function SponsorshipPage() {
  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div id="sponsorship-navbar-top">
      <SponsorshipBreadcrumbSection />
      <SponsorshipTiersSection />
    </div>
  );
}
