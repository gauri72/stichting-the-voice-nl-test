import { useTranslation } from "react-i18next";
import { useCookieConsent } from "../../contexts/CookieConsentContext.jsx";

export default function CookieConsentBanner() {
  const { t } = useTranslation(["cookies"]);
  const { showBanner, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <aside
      className="cookie-consent"
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies:modal.title")}
    >
      <div className="cookie-consent__content">
        <p className="cookie-consent__title">{t("cookies:banner.title")}</p>
        <p className="cookie-consent__text">
          {t("cookies:banner.text")}{" "}
          <a href="/privacy-policy#policy-cookie" className="cookie-consent__link">
            {t("cookies:banner.policyLinkText")}
          </a>
        </p>
      </div>
      <div className="cookie-consent__actions">
        <button
          type="button"
          className="cookie-consent__btn cookie-consent__btn--tertiary"
          onClick={openPreferences}
        >
          {t("cookies:banner.managePreferences")}
        </button>
        <button
          type="button"
          className="cookie-consent__btn cookie-consent__btn--secondary"
          onClick={rejectAll}
        >
          {t("cookies:banner.rejectAll")}
        </button>
        <button
          type="button"
          className="cookie-consent__btn cookie-consent__btn--primary"
          onClick={acceptAll}
        >
          {t("cookies:banner.acceptAll")}
        </button>
      </div>
    </aside>
  );
}
