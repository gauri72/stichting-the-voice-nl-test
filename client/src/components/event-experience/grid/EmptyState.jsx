import { motion } from "framer-motion";
import { IconCalendarOff } from "@tabler/icons-react";

export default function EmptyState({ onClearFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}
      >
        <IconCalendarOff size={56} className="text-evx-text-muted" />
      </motion.div>
      <p className="text-lg font-bold text-evx-heading">No events match your filters</p>
      <p className="text-sm text-evx-text-muted">Try adjusting your search or clearing some filters.</p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-2 rounded-full bg-evx-accent px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          Clear all filters
        </button>
      ) : null}
    </motion.div>
  );
}
