import { useEffect, useRef, useState } from "react";
import DonateBreadcrumbSection from "./DonateBreadcrumbSection";
import DonatePlansCardsSection from "./DonatePlansCardsSection";
import DonatePaymentBlock, { DONATE_CHECKOUT_SESSION_KEY } from "./DonatePaymentBlock";
import DonateAllocationSection from "./DonateAllocationSection";
import DonateRealImpactSection from "./DonateRealImpactSection";
import DonateOtherWaysSection from "./DonateOtherWaysSection";
import { getCheckoutPageState } from "../../utils/stripePayment";
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
  const initialCheckout = getCheckoutPageState(DONATE_CHECKOUT_SESSION_KEY);
  const [selectedTier, setSelectedTier] = useState(initialCheckout.tier);
  const [showPaymentBlock, setShowPaymentBlock] = useState(initialCheckout.showPaymentBlock);
  const paymentRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    warmUpApi(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const { tier, showPaymentBlock: show } = getCheckoutPageState(DONATE_CHECKOUT_SESSION_KEY);
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
      {showPaymentBlock ? (
        <DonatePaymentBlock
          ref={paymentRef}
          tier={selectedTier}
          onClose={() => {
            setSelectedTier(null);
            setShowPaymentBlock(false);
          }}
        />
      ) : null}
      <DonateAllocationSection />
      <DonateRealImpactSection />
      <DonateOtherWaysSection />
    </div>
  );
}
