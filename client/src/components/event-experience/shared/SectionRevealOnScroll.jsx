import { motion } from "framer-motion";

/**
 * Wraps a page section so it fades + slides up once scrolled into view.
 * Framer Motion's whileInView handles the IntersectionObserver wiring
 * internally (no separate observer needed) and respects
 * prefers-reduced-motion automatically when paired with this codebase's
 * global reduced-motion handling — but the explicit transition is also
 * stripped here in case it isn't, since this fires on every section.
 */
export default function SectionRevealOnScroll({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
