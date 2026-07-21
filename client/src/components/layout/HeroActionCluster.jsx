import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCheck, IconDownload, IconBrandWhatsapp } from "@tabler/icons-react";
import { SUPPORTED_LANGUAGES } from "../../i18n/index.js";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import { buildWhatsAppHref } from "../../constants/siteLinks.js";
import "../../styles/hero-action-cluster.css";

function FlagIcon({ code }) {
  if (code === "nl") {
    return (
      <svg className="hero-action-cluster__flag" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#ae1c28" d="M0 0h30v6.67H0z" />
        <path fill="#fff" d="M0 6.67h30v6.66H0z" />
        <path fill="#21468b" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }
  if (code === "de") {
    return (
      <svg className="hero-action-cluster__flag" viewBox="0 0 30 20" aria-hidden="true">
        <path fill="#111" d="M0 0h30v6.67H0z" />
        <path fill="#dd0000" d="M0 6.67h30v6.66H0z" />
        <path fill="#ffce00" d="M0 13.33h30V20H0z" />
      </svg>
    );
  }
  return (
    <svg className="hero-action-cluster__flag" viewBox="0 0 30 20" aria-hidden="true">
      <path fill="#012169" d="M0 0h30v20H0z" />
      <path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
      <path stroke="#fff" strokeWidth="6.5" d="M15 0v20M0 10h30" />
      <path stroke="#c8102e" strokeWidth="3.5" d="M15 0v20M0 10h30" />
    </svg>
  );
}

/**
 * V.App install / language / WhatsApp, as a glass button row anchored to the
 * bottom-left corner of the hero banner — replaces the equivalent global
 * floating buttons on pages that render this (hidden via CSS, see
 * hero-action-cluster.css).
 *
 * The language control here is deliberately self-contained rather than
 * reusing <LanguageSwitcher> — that component's "--header" variant already
 * carries three other context-specific CSS overrides elsewhere (site nav,
 * V.Commerce mobile head, V.Commerce mobile-active body state), and layering
 * a fourth context on top of that was the direct cause of it silently not
 * rendering in its expected spot here. Isolating this one avoids that whole
 * class of conflict.
 */
export default function HeroActionCluster() {
  const { t, i18n } = useTranslation(["common"]);
  const [installOpen, setInstallOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const showInstall = !isStandalonePwa();

  useEffect(() => {
    function onDocClick(event) {
      if (langRef.current && !langRef.current.contains(event.target)) setLangOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setLangOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="hero-action-cluster">
      {showInstall && (
        <button
          type="button"
          className="hero-action-cluster__btn hero-action-cluster__btn--install"
          onClick={() => setInstallOpen(true)}
          aria-label={t("common:heroActionCluster.installAriaLabel")}
        >
          <IconDownload size={15} stroke={1.75} />
        </button>
      )}

      <div className="hero-action-cluster__lang" ref={langRef}>
        <button
          type="button"
          className="hero-action-cluster__btn hero-action-cluster__btn--lang"
          aria-haspopup="menu"
          aria-expanded={langOpen}
          aria-label={t("common:heroActionCluster.languageAriaLabel")}
          onClick={() => setLangOpen((o) => !o)}
        >
          <FlagIcon code={currentLang.code} />
        </button>
        {langOpen && (
          <ul className="hero-action-cluster__lang-menu" role="menu">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={lang.code === currentLang.code}
                  className={`hero-action-cluster__lang-option${lang.code === currentLang.code ? " hero-action-cluster__lang-option--active" : ""}`}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setLangOpen(false);
                  }}
                >
                  <span className="hero-action-cluster__lang-option-label">
                    <FlagIcon code={lang.code} />
                    <span>{lang.nativeLabel}</span>
                  </span>
                  {lang.code === currentLang.code ? <IconCheck size={15} aria-hidden /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        className="hero-action-cluster__btn hero-action-cluster__btn--whatsapp"
        href={buildWhatsAppHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("common:heroActionCluster.whatsappAriaLabel")}
      >
        <IconBrandWhatsapp size={15} stroke={1.75} />
      </a>

      {showInstall && (
        <PwaInstallDialog open={installOpen} variant={PWA_VARIANTS.site} onClose={() => setInstallOpen(false)} />
      )}
    </div>
  );
}
