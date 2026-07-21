import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck, IconDownload, IconMoon, IconSun } from "@tabler/icons-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/index.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import { buildWhatsAppHref } from "../../constants/siteLinks.js";
import "../../styles/header-action-row.css";

function FlagIcon({ code }) {
  if (code === "nl") {
    return (
      <svg className="header-action-row__btn-flag" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#ae1c28" d="M0 0h30v6.67H0z" />
        <path fill="#fff" d="M0 6.67h30v6.66H0z" />
        <path fill="#21468b" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }
  if (code === "de") {
    return (
      <svg className="header-action-row__btn-flag" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#111" d="M0 0h30v6.67H0z" />
        <path fill="#dd0000" d="M0 6.67h30v6.66H0z" />
        <path fill="#ffce00" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }
  return (
    <svg className="header-action-row__btn-flag" viewBox="0 0 30 20" aria-hidden="true">
      <path fill="#012169" d="M0 0h30v20H0z" />
      <path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#fff" strokeWidth="6.5" d="M15 0v20M0 10h30" />
      <path stroke="#c8102e" strokeWidth="3.5" d="M15 0v20M0 10h30" />
    </svg>
  );
}

function InstallButton({ t }) {
  const [open, setOpen] = useState(false);
  if (isStandalonePwa()) return null;
  return (
    <>
      <button
        type="button"
        className="header-action-row__btn header-action-row__btn--install"
        onClick={() => setOpen(true)}
        aria-label={t("common:heroActionCluster.installAriaLabel")}
      >
        <IconDownload size={15} stroke={1.75} />
      </button>
      <PwaInstallDialog open={open} variant={PWA_VARIANTS.site} onClose={() => setOpen(false)} />
    </>
  );
}

function LanguageButton({ t, i18n }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function onDocClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
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

  return (
    <div className="header-action-row__btn-lang" ref={ref}>
      <button
        type="button"
        className="header-action-row__btn header-action-row__btn--lang"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("common:heroActionCluster.languageAriaLabel")}
        onClick={() => setOpen((o) => !o)}
      >
        <FlagIcon code={current.code} />
      </button>
      {open && (
        <ul className="header-action-row__lang-menu" role="menu">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={lang.code === current.code}
                className={`header-action-row__lang-option${lang.code === current.code ? " header-action-row__lang-option--active" : ""}`}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
              >
                <span className="header-action-row__lang-option-label">
                  <FlagIcon code={lang.code} />
                  <span>{lang.nativeLabel}</span>
                </span>
                {lang.code === current.code ? <IconCheck size={15} aria-hidden /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WhatsAppButton({ t }) {
  return (
    <a
      className="header-action-row__btn header-action-row__btn--whatsapp"
      href={buildWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("common:heroActionCluster.whatsappAriaLabel")}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-3.3-.7-2.8-1.1-4.6-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.4 1.5 2.7 1.6.3.1.4.1.6-.1l.7-.8c.2-.3.4-.2.7-.1l1.9.9c.2.1.4.2.4.4.1.2.1.9-.1 1.4z" />
      </svg>
    </a>
  );
}

function ThemeToggleButton({ t }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="header-action-row__btn header-action-row__btn--theme"
      onClick={toggleTheme}
      aria-label={t("common:themeToggle.chooseTheme")}
    >
      {isDark ? <IconSun size={15} stroke={1.75} /> : <IconMoon size={15} stroke={1.75} />}
    </button>
  );
}

/**
 * Desktop-only glass button row — install / language / WhatsApp / theme
 * toggle — positioned under the sign-in button in the header. Replaces the
 * old standalone header ThemeToggle + the global floating buttons (hidden
 * via CSS, see header-action-row.css) so those aren't duplicated.
 */
export default function HeaderActionRow({ showThemeToggle = true }) {
  const { t, i18n } = useTranslation(["common"]);

  return (
    <div className="header-action-row">
      <InstallButton t={t} />
      <LanguageButton t={t} i18n={i18n} />
      <WhatsAppButton t={t} />
      {showThemeToggle && <ThemeToggleButton t={t} />}
    </div>
  );
}
