import { useEffect, useRef, useState } from "react";
import { IconCheck, IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const OPTIONS = [
  { value: "dark", label: "Dark", description: "Always use dark theme", Icon: IconMoon },
  { value: "light", label: "Light", description: "Always use light theme", Icon: IconSun },
  { value: "auto", label: "Auto", description: "Follow local sunrise and sunset", Icon: IconSunMoon },
];

function formatTransition(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function ThemeToggle({ className = "" }) {
  const { theme, preference, autoStatus, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const isDark = theme === "dark";

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

  const autoDetail = autoStatus.locating
    ? "Finding your location…"
    : autoStatus.source === "sun" && autoStatus.nextTransition
      ? `${isDark ? "Light" : "Dark"} at ${formatTransition(autoStatus.nextTransition)}`
      : autoStatus.locationError || "Using your device theme";

  return (
    <div className={`theme-picker ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Choose theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`${preference === "auto" ? "Auto" : isDark ? "Dark" : "Light"} theme`}
      >
        {preference === "auto" ? (
          <IconSunMoon className="theme-toggle__icon" aria-hidden stroke={1.75} />
        ) : isDark ? (
          <IconMoon className="theme-toggle__icon" aria-hidden stroke={1.75} />
        ) : (
          <IconSun className="theme-toggle__icon" aria-hidden stroke={1.75} />
        )}
        <span className="visually-hidden">Choose theme</span>
      </button>

      {isOpen ? (
        <div className="theme-picker__menu" role="menu" aria-label="Theme preference">
          <div className="theme-picker__eyebrow">Appearance</div>
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
          <p className="theme-picker__privacy">Location stays on this device and is used only for daylight timing.</p>
        </div>
      ) : null}
    </div>
  );
}
