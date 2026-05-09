import { useEffect } from "react";
import SponsorshipBreadcrumbSection from "./SponsorshipBreadcrumbSection";
import SponsorshipTiersSection from "./SponsorshipTiersSection";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function SponsorshipPage() {
  // Free-tier hosts (e.g. Render) idle the API after ~15 min. Ping the health
  // endpoint as soon as the page mounts so the dyno is already awake by the
  // time the visitor picks a tier and submits the form.
  useEffect(() => {
    if (!API_BASE) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store"
    }).catch(() => {
      // Fire-and-forget; errors here are not actionable.
    });
    return () => controller.abort();
  }, []);

  return (
    <div id="sponsorship-navbar-top">
      <SponsorshipBreadcrumbSection />
      <SponsorshipTiersSection />
    </div>
  );
}
