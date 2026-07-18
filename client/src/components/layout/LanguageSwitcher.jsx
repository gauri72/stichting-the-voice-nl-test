import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck } from "@tabler/icons-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/index.js";
import "../../styles/language-switcher.css";

function CountryFlag({ code }) {
  if (code === "nl") {
    return (
      <svg className="language-switcher__flag-svg" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#ae1c28" d="M0 0h30v6.67H0z" />
        <path fill="#fff" d="M0 6.67h30v6.66H0z" />
        <path fill="#21468b" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }

  if (code === "de") {
    return (
      <svg className="language-switcher__flag-svg" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#111" d="M0 0h30v6.67H0z" />
        <path fill="#dd0000" d="M0 6.67h30v6.66H0z" />
        <path fill="#ffce00" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }

  return (
    <svg className="language-switcher__flag-svg" viewBox="0 0 30 20" aria-hidden="true">
      <path fill="#012169" d="M0 0h30v20H0z" />
      <path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#fff" strokeWidth="6.5" d="M15 0v20M0 10h30" />
      <path stroke="#c8102e" strokeWidth="3.5" d="M15 0v20M0 10h30" />
    </svg>
  );
}

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
                  <span className="language-switcher__flag" aria-hidden><CountryFlag code={lang.code} /></span>
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
        <span className="language-switcher__flag" aria-hidden><CountryFlag code={current.code} /></span>
        {!header ? <span className="language-switcher__code">{current.code.toUpperCase()}</span> : null}
      </button>
    </div>
  );
}
