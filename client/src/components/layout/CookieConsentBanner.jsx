import { useMemo, useState } from "react";
import { applyCookieConsent, readCookieConsent } from "../../utils/cookieConsent.js";

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState(() => readCookieConsent());

  const isVisible = useMemo(() => consent !== "accepted" && consent !== "rejected", [consent]);

  if (!isVisible) return null;

  function handleChoice(nextConsent) {
    applyCookieConsent(nextConsent);
    setConsent(nextConsent);
  }

  return (
    <aside className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <div className="cookie-consent__content">
        <p className="cookie-consent__title">Cookies on this website</p>
        <p className="cookie-consent__text">
          We use essential cookies to keep the site working and optional cookies to understand usage and improve
          your experience.
        </p>
      </div>
      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__btn cookie-consent__btn--secondary" onClick={() => handleChoice("rejected")}>
          Reject Optional
        </button>
        <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={() => handleChoice("accepted")}>
          Accept All
        </button>
      </div>
    </aside>
  );
}
