import { AnimatePresence, motion } from "framer-motion";
import EventCard from "../card/EventCard.jsx";
import SkeletonCard from "./SkeletonCard.jsx";

export default function EventsGrid({ events, loading, onWatchShort }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <EventCard variant="grid" event={event} onWatchShort={onWatchShort} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
