import { useEffect, useRef, useState } from "react";
import SponsorshipBreadcrumbSection from "./SponsorshipBreadcrumbSection";
import SponsorshipWhySection from "./SponsorshipWhySection";
import SponsorshipPlansCardsSection from "./SponsorshipPlansCardsSection";
import SponsorshipPaymentBlock, { SPONSOR_CHECKOUT_SESSION_KEY } from "./SponsorshipPaymentBlock";
import { getCheckoutPageState } from "../../utils/stripePayment";
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
  const initialCheckout = getCheckoutPageState(SPONSOR_CHECKOUT_SESSION_KEY);
  const [selectedTier, setSelectedTier] = useState(initialCheckout.tier);
  const [showPaymentBlock, setShowPaymentBlock] = useState(initialCheckout.showPaymentBlock);
  const paymentRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const { tier, showPaymentBlock: show } = getCheckoutPageState(SPONSOR_CHECKOUT_SESSION_KEY);
    if (tier) setSelectedTier(tier);
    if (show) setShowPaymentBlock(true);
  }, []);

  useEffect(() => {
    if (selectedTier && paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedTier]);

  function handleSelectTier(tier) {
    setShowPaymentBlock(true);
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
      {showPaymentBlock ? (
        <SponsorshipPaymentBlock
          ref={paymentRef}
          tier={selectedTier}
          onClose={() => {
            setSelectedTier(null);
            setShowPaymentBlock(false);
          }}
        />
      ) : null}
      <SponsorshipWhySection />
    </div>
  );
}
