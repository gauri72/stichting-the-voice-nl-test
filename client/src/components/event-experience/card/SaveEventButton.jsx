import { motion } from "framer-motion";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useEventExperience } from "../EventExperienceContext.jsx";

export default function SaveEventButton({ eventId, className = "" }) {
  const { isSaved, toggleSaved } = useEventExperience();
  const saved = isSaved(eventId);

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(eventId);
      }}
      whileTap={{ scale: 1.35 }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved events" : "Save this event"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 ${className}`}
    >
      {saved ? (
        <motion.span key="saved" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
          <IconHeartFilled size={16} className="text-red-500" />
        </motion.span>
      ) : (
        <IconHeart size={16} />
      )}
    </motion.button>
  );
}
