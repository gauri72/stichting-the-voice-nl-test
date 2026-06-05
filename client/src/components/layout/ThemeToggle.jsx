import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <IconSun className="theme-toggle__icon" aria-hidden stroke={1.75} />
      ) : (
        <IconMoon className="theme-toggle__icon" aria-hidden stroke={1.75} />
      )}
      <span className="visually-hidden">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
