import { useTranslation } from "react-i18next";
import { InstallButton, LanguageButton, WhatsAppButton, ThemeToggleButton } from "./HeaderActionButtons.jsx";
import "../../styles/header-action-row.css";

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
      <InstallButton t={t} btnClass="header-action-row__btn" />
      <LanguageButton
        t={t}
        i18n={i18n}
        btnClass="header-action-row__btn"
        menuClass="header-action-row__lang-menu"
        optionClass="header-action-row__lang-option"
      />
      <WhatsAppButton t={t} btnClass="header-action-row__btn" />
      {showThemeToggle && <ThemeToggleButton t={t} btnClass="header-action-row__btn" />}
    </div>
  );
}
