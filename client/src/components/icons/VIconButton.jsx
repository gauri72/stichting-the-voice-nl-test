import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import VIcon, { SIZE_CLASSES } from "./VIcon.jsx";
import { ConfirmBooking } from "./icons/index.js";
import "./VIcon.css";

// Slightly larger than the icon itself so there's a visible padded hit area
// — matches the existing site convention of circular icon buttons (e.g. the
// WhatsApp floating action button) rather than an icon with zero padding.
const BUTTON_SIZE_CLASSES = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

function humanizeVariant(variant) {
  return String(variant || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Circular/rounded button wrapping any VIcon variant. Owns the hover lift +
 * tap scale animation itself (the inner VIcon is rendered non-animated so
 * the two don't compound), plus loading/disabled/tooltip/success states
 * that only make sense at the "this is a clickable action" level.
 */
export default function VIconButton({
  variant,
  size = "md",
  color = "accent",
  onClick,
  tooltip,
  label,
  disabled = false,
  loading = false,
  success = false,
  rounded = "full", // "full" (circle) | "lg" (rounded square)
  className = "",
  ...rest
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const tooltipId = useId();

  const accessibleLabel = label || tooltip || humanizeVariant(variant);
  const isBusy = loading || success;
  const playAnimations = !reduceMotion && !disabled && !isBusy;

  function showTooltip() {
    setTooltipVisible(true);
  }
  function hideTooltip() {
    setTooltipVisible(false);
  }

  return (
    <span className="relative inline-flex">
      <motion.button
        type="button"
        disabled={disabled || isBusy}
        aria-label={accessibleLabel}
        aria-describedby={tooltip ? tooltipId : undefined}
        onClick={disabled || isBusy ? undefined : onClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`v-icon-button inline-flex items-center justify-center border border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          rounded === "full" ? "rounded-full" : "rounded-xl"
        } ${BUTTON_SIZE_CLASSES[size] || BUTTON_SIZE_CLASSES.md} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${className}`}
        style={{
          "--vicon-btn-bg": `var(--vicon-${color}-bg)`,
          "--vicon-btn-bg-hover": `var(--vicon-${color}-bg-hover)`,
          backgroundColor: "var(--vicon-btn-bg)",
          color: `var(--vicon-${color}-fg)`,
          outlineColor: `var(--vicon-${color}-fg)`,
        }}
        whileHover={playAnimations ? { scale: 1.08, y: -2 } : undefined}
        whileTap={playAnimations ? { scale: 0.94 } : undefined}
        {...rest}
      >
        {loading ? (
          <ConfirmBooking className="v-icon-spin" style={{ width: "60%", height: "60%" }} aria-hidden="true" />
        ) : success ? (
          <ConfirmBooking className="v-icon-success-draw" style={{ width: "60%", height: "60%" }} aria-hidden="true" />
        ) : (
          <VIcon variant={variant} size={size} color={color} animated={false} style={{ width: "60%", height: "60%" }} />
        )}
      </motion.button>

      {tooltip && tooltipVisible && !disabled && (
        <motion.span
          id={tooltipId}
          role="tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
        >
          {tooltip}
        </motion.span>
      )}
    </span>
  );
}
