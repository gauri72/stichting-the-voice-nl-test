import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// A lightweight glow that follows the pointer over the page — not a full
// native-cursor replacement (keeps text selection/link affordance intact).
// Desktop pointer only; skipped entirely on touch devices and under
// prefers-reduced-motion.
export default function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springX = useSpring(x, { damping: 28, stiffness: 220, mass: 0.4 });
  const springY = useSpring(y, { damping: 28, stiffness: 220, mass: 0.4 });
  const hasPointerRef = useRef(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !isFinePointer) return undefined;

    function onPointerMove(e) {
      hasPointerRef.current = true;
      x.set(e.clientX);
      y.set(e.clientY);
      setEnabled(true);
    }

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[5] h-64 w-64 rounded-full bg-evx-accent/15 blur-3xl dark:bg-evx-accent/20"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
    />
  );
}
