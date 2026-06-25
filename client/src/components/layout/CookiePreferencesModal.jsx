import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react";
import { useCookieConsent } from "../../contexts/CookieConsentContext.jsx";
import { COOKIE_CATEGORIES, DEFAULT_CATEGORIES } from "../../utils/cookieConsent.js";

function CookieToggle({ id, checked, disabled, onChange, label }) {
  return (
    <span className="cookie-toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-label={label}
      />
      <span className="cookie-toggle__track" aria-hidden="true" />
      <span className="cookie-toggle__thumb" aria-hidden="true" />
    </span>
  );
}

export default function CookiePreferencesModal() {
  const { t } = useTranslation(["cookies"]);
  const { showModal, categories, doNotSell, closePreferences, savePreferences } = useCookieConsent();
  const [draftCategories, setDraftCategories] = useState({ ...DEFAULT_CATEGORIES, ...categories });
  const [draftDoNotSell, setDraftDoNotSell] = useState(doNotSell);
  const panelRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      setDraftCategories({ ...DEFAULT_CATEGORIES, ...categories });
      setDraftDoNotSell(doNotSell);
    }
  }, [showModal, categories, doNotSell]);

  useEffect(() => {
    if (!showModal) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        closePreferences();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector(".cookie-modal__close")?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showModal, closePreferences]);

  if (!showModal) return null;

  function toggleCategory(key, value) {
    setDraftCategories((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDoNotSell(value) {
    setDraftDoNotSell(value);
    if (value) {
      setDraftCategories((prev) => ({ ...prev, marketing: false }));
    }
  }

  function handleSave() {
    savePreferences(draftCategories, draftDoNotSell);
  }

  return createPortal(
    <div className="cookie-modal" role="presentation" onClick={closePreferences}>
      <div
        ref={panelRef}
        className="cookie-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cookie-modal__header">
          <h2 id="cookie-modal-title" className="cookie-modal__title">
            {t("cookies:modal.title")}
          </h2>
          <button
            type="button"
            className="cookie-modal__close"
            onClick={closePreferences}
            aria-label={t("cookies:modal.close")}
          >
            <IconX size={20} stroke={2} aria-hidden />
          </button>
        </div>

        <p className="cookie-modal__intro">{t("cookies:modal.intro")}</p>

        <div className="cookie-modal__categories">
          {COOKIE_CATEGORIES.map(({ key, icon, required }) => (
            <div className="cookie-modal__category" key={key}>
              <span className="cookie-modal__category-icon" aria-hidden="true">
                {icon}
              </span>
              <div className="cookie-modal__category-body">
                <div className="cookie-modal__category-head">
                  <label className="cookie-modal__category-title" htmlFor={`cookie-toggle-${key}`}>
                    {t(`cookies:modal.categories.${key}.title`)}
                  </label>
                  {required ? (
                    <span className="cookie-modal__always-active">{t("cookies:modal.alwaysActive")}</span>
                  ) : (
                    <CookieToggle
                      id={`cookie-toggle-${key}`}
                      checked={Boolean(draftCategories[key])}
                      onChange={(value) => toggleCategory(key, value)}
                      label={t(`cookies:modal.categories.${key}.title`)}
                    />
                  )}
                </div>
                <p className="cookie-modal__category-desc">{t(`cookies:modal.categories.${key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="cookie-modal__divider" />

        <div className="cookie-modal__do-not-sell">
          <div className="cookie-modal__category-body">
            <div className="cookie-modal__category-head">
              <label className="cookie-modal__category-title" htmlFor="cookie-toggle-do-not-sell">
                {t("cookies:modal.doNotSell.title")}
              </label>
              <CookieToggle
                id="cookie-toggle-do-not-sell"
                checked={draftDoNotSell}
                onChange={toggleDoNotSell}
                label={t("cookies:modal.doNotSell.title")}
              />
            </div>
            <p className="cookie-modal__category-desc">{t("cookies:modal.doNotSell.description")}</p>
          </div>
        </div>

        <div className="cookie-modal__footer">
          <button type="button" className="cookie-consent__btn cookie-consent__btn--secondary" onClick={closePreferences}>
            {t("cookies:modal.cancel")}
          </button>
          <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={handleSave}>
            {t("cookies:modal.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
