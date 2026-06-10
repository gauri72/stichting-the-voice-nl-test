import { useEffect, useRef, useState } from "react";
import SponsorshipBreadcrumbSection from "./SponsorshipBreadcrumbSection";
import SponsorshipWhySection from "./SponsorshipWhySection";
import SponsorshipPlansCardsSection from "./SponsorshipPlansCardsSection";
import SponsorshipPaymentBlock, { SPONSOR_CHECKOUT_SESSION_KEY } from "./SponsorshipPaymentBlock";
import { isPaymentReturnUrl, readCheckoutSession } from "../../utils/stripePayment";
import "../../styles/sponsorship-page.css";

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
        cache: "no-store",
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
  const [selectedTier, setSelectedTier] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isPaymentReturnUrl()) return;
    const saved = readCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY);
    if (saved?.tier) setSelectedTier(saved.tier);
  }, []);

  useEffect(() => {
    if (selectedTier && paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedTier]);

  function handleSelectTier(tier) {
    setSelectedTier({
      id: tier.id,
      name: tier.name,
      amountLabel: tier.price,
      allowCustom: Boolean(tier.allowCustom),
      customOnly: Boolean(tier.customOnly),
    });
  }

  return (
    <div id="sponsorship-navbar-top" className="sponsorship-page-shell">
      <SponsorshipBreadcrumbSection />
      <SponsorshipPlansCardsSection
        selectedTierId={selectedTier?.id}
        onSelectTier={handleSelectTier}
      />
      {selectedTier || isPaymentReturnUrl() ? (
        <SponsorshipPaymentBlock
          ref={paymentRef}
          tier={selectedTier || readCheckoutSession(SPONSOR_CHECKOUT_SESSION_KEY)?.tier}
          onClose={() => setSelectedTier(null)}
        />
      ) : null}
      <SponsorshipWhySection />
    </div>
  );
}
