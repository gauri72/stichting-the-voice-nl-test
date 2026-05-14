import { useEffect } from "react";
import DonateHeroSection from "./DonateHeroSection";
import DonateChooseImpactSection from "./DonateChooseImpactSection";
import DonateAllocationSection from "./DonateAllocationSection";
import DonateRealImpactSection from "./DonateRealImpactSection";
import DonateOtherWaysSection from "./DonateOtherWaysSection";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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
      // retry
    }
  }
  console.warn("[warm-up] API did not respond after retries");
}

export default function DonatePage() {
  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div id="donate-navbar-top">
      <DonateHeroSection />
      <DonateChooseImpactSection />
      <DonateAllocationSection />
      <DonateRealImpactSection />
      <DonateOtherWaysSection />
    </div>
  );
}
