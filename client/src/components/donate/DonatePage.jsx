import { useEffect, useRef, useState } from "react";
import DonateBreadcrumbSection from "./DonateBreadcrumbSection";
import DonatePlansCardsSection from "./DonatePlansCardsSection";
import DonatePaymentBlock, { DONATE_CHECKOUT_SESSION_KEY } from "./DonatePaymentBlock";
import DonateAllocationSection from "./DonateAllocationSection";
import DonateRealImpactSection from "./DonateRealImpactSection";
import DonateOtherWaysSection from "./DonateOtherWaysSection";
import { isPaymentReturnUrl, readCheckoutSession } from "../../utils/stripePayment";
import "../../styles/donate-page.css";

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
      // retry
    }
  }
  console.warn("[warm-up] API did not respond after retries");
}

export default function DonatePage() {
  const [selectedTier, setSelectedTier] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isPaymentReturnUrl()) return;
    const saved = readCheckoutSession(DONATE_CHECKOUT_SESSION_KEY);
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
      note: tier.description,
      allowCustom: Boolean(tier.allowCustom),
      customOnly: Boolean(tier.customOnly),
    });
  }

  return (
    <div id="donate-navbar-top" className="donate-page-shell">
      <DonateBreadcrumbSection />
      <DonatePlansCardsSection
        selectedTierId={selectedTier?.id}
        onSelectTier={handleSelectTier}
      />
      {selectedTier || isPaymentReturnUrl() ? (
        <DonatePaymentBlock
          ref={paymentRef}
          tier={selectedTier || readCheckoutSession(DONATE_CHECKOUT_SESSION_KEY)?.tier}
          onClose={() => setSelectedTier(null)}
        />
      ) : null}
      <DonateAllocationSection />
      <DonateRealImpactSection />
      <DonateOtherWaysSection />
    </div>
  );
}
