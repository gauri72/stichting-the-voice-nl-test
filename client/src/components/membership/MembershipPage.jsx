import { useEffect, useRef, useState } from "react";
import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipComparisonTableSection from "./MembershipComparisonTableSection";
import MembershipPlansCardsSection from "./MembershipPlansCardsSection";
import MembershipPaymentBlock, {
  MEMBERSHIP_CHECKOUT_SESSION_KEY,
} from "./MembershipPaymentBlock";
import { isPaymentReturnUrl, readCheckoutSession } from "../../utils/stripePayment";
import "../../styles/membership-page.css";

export default function MembershipPage() {
  const [selectedTier, setSelectedTier] = useState(null);
  const paymentRef = useRef(null);

  useEffect(() => {
    if (!isPaymentReturnUrl()) return;
    const saved = readCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY);
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
    });
  }

  return (
    <div id="membership-navbar-top" className="membership-page-shell">
      <MembershipBreadcrumbSection />
      <MembershipComparisonTableSection />
      <MembershipPlansCardsSection
        selectedTierId={selectedTier?.id}
        onSelectTier={handleSelectTier}
      />
      {selectedTier || isPaymentReturnUrl() ? (
        <MembershipPaymentBlock
          ref={paymentRef}
          tier={selectedTier || readCheckoutSession(MEMBERSHIP_CHECKOUT_SESSION_KEY)?.tier}
          onClose={() => setSelectedTier(null)}
        />
      ) : null}
    </div>
  );
}
