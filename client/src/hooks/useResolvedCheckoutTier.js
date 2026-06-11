import { useEffect, useState } from "react";
import { readCheckoutSession } from "../utils/stripePayment.js";

/** Tier from props, falling back to sessionStorage (Stripe redirect return). */
export function useResolvedCheckoutTier(sessionKey, tierProp) {
  const [fallbackTier, setFallbackTier] = useState(
    () => readCheckoutSession(sessionKey)?.tier ?? null
  );

  useEffect(() => {
    if (tierProp) {
      setFallbackTier(tierProp);
      return;
    }
    const saved = readCheckoutSession(sessionKey);
    if (saved?.tier) setFallbackTier(saved.tier);
  }, [sessionKey, tierProp]);

  return tierProp ?? fallbackTier;
}
