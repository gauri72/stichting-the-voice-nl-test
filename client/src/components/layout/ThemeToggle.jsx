import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { theme, isAuto, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={
        isDark
          ? isAuto
            ? "Switch to light (currently night in your region)"
            : "Light mode"
          : isAuto
            ? "Switch to dark (currently day in your region)"
            : "Dark mode"
      }
    >
      {isDark ? (
        <IoSunnyOutline className="theme-toggle__icon" aria-hidden />
      ) : (
        <IoMoonOutline className="theme-toggle__icon" aria-hidden />
      )}
      <span className="visually-hidden">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
