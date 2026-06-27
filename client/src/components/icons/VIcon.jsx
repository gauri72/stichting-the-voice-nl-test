import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ICON_MAP } from "./icons/index.js";
import "./VIcon.css";

// px values backing the size prop — chosen to land exactly on Tailwind's
// standard w-*/h-* scale (no arbitrary-value classes, which don't reliably
// generate in this project's Tailwind v4 setup; see VIcon.css's header note).
const SIZE_CLASSES = {
  sm: "w-6 h-6", // 24px
  md: "w-8 h-8", // 32px
  lg: "w-12 h-12", // 48px
  xl: "w-16 h-16", // 64px
};

// Each color "role" is a CSS custom property pair defined in VIcon.css,
// already theme-aware via [data-theme="dark"|"light"] — VIcon never needs
// to know the actual hex values, just which role it was asked for.
const COLOR_ROLES = ["accent", "success", "warning", "danger", "pro", "neutral"];

/**
 * Base V Icon component. Renders one of the 20 registered icon variants
 * (see icons/index.js) inside a sized, colored, optionally-interactive
 * wrapper. The V-chevron embedded in every icon SVG gets its own hover
 * "draw in" animation purely via CSS (see VIcon.css); the lift/scale on
 * the icon as a whole is Framer Motion.
 */
export default function VIcon({
  variant,
  size = "md",
  color = "neutral",
  animated = true,
  onClick,
  label,
  className = "",
  ...rest
}) {
  const [pulsing, setPulsing] = useState(false);
  const pulseTimeout = useRef(null);
  const reduceMotion = useReducedMotion();

  const IconComponent = ICON_MAP[variant];
  if (!IconComponent) {
    if (import.meta.env?.DEV) {
      console.warn(`VIcon: unknown variant "${variant}".`);
    }
    return null;
  }

  const colorRole = COLOR_ROLES.includes(color) ? color : "neutral";
  const isInteractive = typeof onClick === "function";
  const playAnimations = animated && !reduceMotion;

  function handleClick(event) {
    if (playAnimations) {
      setPulsing(true);
      clearTimeout(pulseTimeout.current);
      pulseTimeout.current = setTimeout(() => setPulsing(false), 340);
    }
    onClick?.(event);
  }

  const Wrapper = isInteractive ? motion.button : motion.span;

  return (
    <Wrapper
      type={isInteractive ? "button" : undefined}
      className={`v-icon-wrapper inline-flex shrink-0 items-center justify-center rounded-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${playAnimations ? "v-icon-animated" : ""} ${pulsing ? "v-icon-pulse-active" : ""} ${className}`}
      style={{ color: `var(--vicon-${colorRole}-fg)` }}
      onClick={isInteractive ? handleClick : undefined}
      whileHover={playAnimations ? { scale: 1.08, y: -2 } : undefined}
      whileTap={playAnimations ? { scale: 0.94 } : undefined}
      initial={playAnimations ? { opacity: 0, y: 6 } : undefined}
      animate={playAnimations ? { opacity: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-label={label || undefined}
      aria-hidden={!label && !isInteractive ? "true" : undefined}
      role={isInteractive ? "button" : undefined}
      {...rest}
    >
      <IconComponent width="100%" height="100%" />
    </Wrapper>
  );
}

export { COLOR_ROLES, SIZE_CLASSES };
