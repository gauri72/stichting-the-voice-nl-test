import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck } from "@tabler/icons-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/index.js";
import "../../styles/language-switcher.css";

const LANGUAGE_FLAGS = {
  en: "🇬🇧",
  nl: "🇳🇱",
  de: "🇩🇪",
};

export default function LanguageSwitcher({ embedded = false, header = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const current =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  function selectLanguage(code) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div className={`language-switcher${embedded ? " language-switcher--embedded" : ""}${header ? " language-switcher--header" : ""}`} ref={rootRef}>
      {open ? (
        <ul className="language-switcher__menu" role="menu" aria-label="Choose language">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={lang.code === current.code}
                className={`language-switcher__option${lang.code === current.code ? " language-switcher__option--active" : ""}`}
                onClick={() => selectLanguage(lang.code)}
              >
                <span className="language-switcher__option-label">
                  <span className="language-switcher__flag" aria-hidden>{LANGUAGE_FLAGS[lang.code] || "🌐"}</span>
                  <span>{lang.nativeLabel}</span>
                </span>
                {lang.code === current.code ? <IconCheck size={16} aria-hidden /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="language-switcher__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        title="Change language"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="language-switcher__flag" aria-hidden>{LANGUAGE_FLAGS[current.code] || "🌐"}</span>
        {!header ? <span className="language-switcher__code">{current.code.toUpperCase()}</span> : null}
      </button>
    </div>
  );
}
