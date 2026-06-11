import { useEffect, useRef, useState } from "react";
import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipComparisonTableSection from "./MembershipComparisonTableSection";
import MembershipPlansCardsSection from "./MembershipPlansCardsSection";
import MembershipPaymentBlock, {
  MEMBERSHIP_CHECKOUT_SESSION_KEY,
} from "./MembershipPaymentBlock";
import { getCheckoutPageState } from "../../utils/stripePayment";
import "../../styles/membership-page.css";

export default function MembershipPage() {
  const initialCheckout = getCheckoutPageState(MEMBERSHIP_CHECKOUT_SESSION_KEY);
  const [selectedTier, setSelectedTier] = useState(initialCheckout.tier);
  const [showPaymentBlock, setShowPaymentBlock] = useState(initialCheckout.showPaymentBlock);
  const paymentRef = useRef(null);

  useEffect(() => {
    const { tier, showPaymentBlock: show } = getCheckoutPageState(MEMBERSHIP_CHECKOUT_SESSION_KEY);
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
    });
  }

  return (
    <div id="membership-navbar-top" className="membership-page-shell">
      <MembershipBreadcrumbSection />
      <MembershipPlansCardsSection
        selectedTierId={selectedTier?.id}
        onSelectTier={handleSelectTier}
      />
      {showPaymentBlock ? (
        <MembershipPaymentBlock
          ref={paymentRef}
          tier={selectedTier}
          onClose={() => {
            setSelectedTier(null);
            setShowPaymentBlock(false);
          }}
        />
      ) : null}
      <MembershipComparisonTableSection />
    </div>
  );
}
