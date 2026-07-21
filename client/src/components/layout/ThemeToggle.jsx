import { useEffect, useRef, useState } from "react";
import { IconCheck, IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext.jsx";

function formatTransition(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function ThemeToggle({ className = "" }) {
  const { t } = useTranslation(["common"]);
  const { theme, preference, autoStatus, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const isDark = theme === "dark";

  const OPTIONS = [
    { value: "dark", label: t("common:themeToggle.dark"), description: t("common:themeToggle.darkDescription"), Icon: IconMoon },
    { value: "light", label: t("common:themeToggle.light"), description: t("common:themeToggle.lightDescription"), Icon: IconSun },
    { value: "auto", label: t("common:themeToggle.auto"), description: t("common:themeToggle.autoDescription"), Icon: IconSunMoon },
  ];

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event) => {
      if (event.key === "Escape" || !rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isOpen]);

  const modeLabel = isDark ? t("common:themeToggle.light") : t("common:themeToggle.dark");
  const autoDetail = autoStatus.locating
    ? t("common:themeToggle.locating")
    : autoStatus.source === "sun" && autoStatus.nextTransition
      ? t("common:themeToggle.transitionAt", { mode: modeLabel, time: formatTransition(autoStatus.nextTransition) })
      : autoStatus.locationError || t("common:themeToggle.usingDeviceTheme");

  const currentModeLabel =
    preference === "auto"
      ? t("common:themeToggle.auto")
      : isDark
        ? t("common:themeToggle.dark")
        : t("common:themeToggle.light");

  return (
    <div className={`theme-picker ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("common:themeToggle.chooseTheme")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={t("common:themeToggle.themeTitle", { mode: currentModeLabel })}
      >
        {preference === "auto" ? (
          <IconSunMoon className="theme-toggle__icon" aria-hidden stroke={1.75} />
        ) : isDark ? (
          <IconMoon className="theme-toggle__icon" aria-hidden stroke={1.75} />
        ) : (
          <IconSun className="theme-toggle__icon" aria-hidden stroke={1.75} />
        )}
        <span className="visually-hidden">{t("common:themeToggle.chooseTheme")}</span>
      </button>

      {isOpen ? (
        <div className="theme-picker__menu" role="menu" aria-label={t("common:themeToggle.themePreference")}>
          <div className="theme-picker__eyebrow">{t("common:themeToggle.appearance")}</div>
          {OPTIONS.map(({ value, label, description, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              className={`theme-picker__option${preference === value ? " is-active" : ""}`}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
            >
              <span className="theme-picker__option-icon"><Icon aria-hidden stroke={1.7} /></span>
              <span className="theme-picker__copy">
                <strong>{label}</strong>
                <small>{value === "auto" && preference === "auto" ? autoDetail : description}</small>
              </span>
              {preference === value ? <IconCheck className="theme-picker__check" aria-hidden /> : null}
            </button>
          ))}
          <p className="theme-picker__privacy">{t("common:themeToggle.privacyNote")}</p>
        </div>
      ) : null}
    </div>
  );
}
