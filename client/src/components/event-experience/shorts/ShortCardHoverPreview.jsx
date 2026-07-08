import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ShortCardHoverPreview({ event, onWatchFull }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black via-black/85 to-transparent p-2.5 pt-10"
    >
      <p className="line-clamp-1 text-xs font-bold text-white">{event.title}</p>
      {event.description ? (
        <p className="line-clamp-2 text-[10px] text-white/70">{event.description}</p>
      ) : null}
      <p className="text-[10px] text-white/60">{event.dateLabel}</p>
      <div className="mt-1 flex gap-1.5">
        <Link
          to={`/events/${event.slug || event.id}/tickets`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 rounded-full bg-evx-accent px-2 py-1.5 text-center text-[10px] font-bold text-white"
        >
          Get Tickets
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onWatchFull?.(event);
          }}
          className="flex-1 rounded-full border border-white/40 px-2 py-1.5 text-[10px] font-semibold text-white"
        >
          Watch Full Short
        </button>
      </div>
    </motion.div>
  );
}
