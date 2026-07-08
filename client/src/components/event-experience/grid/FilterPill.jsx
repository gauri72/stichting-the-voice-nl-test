import { motion } from "framer-motion";

export default function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-evx-accent bg-evx-accent text-white"
          : "border-evx-border text-evx-text-secondary hover:border-evx-accent/60 hover:text-evx-accent"
      }`}
    >
      {label}
    </motion.button>
  );
}
