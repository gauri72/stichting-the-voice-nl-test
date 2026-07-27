import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconGift, IconX } from "@tabler/icons-react";
import { captureReferralFromUrl } from "../../utils/referralCapture.js";
import "../../styles/referral-welcome-toast.css";

const AUTO_DISMISS_MS = 8000;

// Also owns referral capture (not just display) — a landing page shouldn't silently stash the
// code with zero feedback, so capture and "here's what just happened" are one component.
export default function ReferralWelcomeToast() {
  const { t } = useTranslation(["common"]);
  const { search } = useLocation();
  const [code, setCode] = useState(null);

  useEffect(() => {
    const captured = captureReferralFromUrl();
    if (captured) setCode(captured);
  }, [search]);

  useEffect(() => {
    if (!code) return undefined;
    const timer = window.setTimeout(() => setCode(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!code) return null;

  return (
    <div className="referral-welcome-toast" role="status" aria-live="polite">
      <IconGift className="referral-welcome-toast__icon" aria-hidden="true" />
      <p>{t("common:referralToast.message", { code })}</p>
      <button
        type="button"
        className="referral-welcome-toast__dismiss"
        onClick={() => setCode(null)}
        aria-label={t("common:referralToast.dismiss")}
      >
        <IconX aria-hidden="true" />
      </button>
    </div>
  );
}
