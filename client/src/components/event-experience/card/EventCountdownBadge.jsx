import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconClock } from "@tabler/icons-react";

const DAY_MS = 24 * 60 * 60 * 1000;

function getRemainingMs(date, startTime) {
  if (!date) return null;
  const datePart = (typeof date === "string" ? date : date.toISOString()).slice(0, 10);
  const target = startTime ? new Date(`${datePart}T${startTime}`) : new Date(datePart);
  return target.getTime() - Date.now();
}

// Only renders for events starting within the next 24 hours — a visible
// urgency cue, not a generic "time until" display.
export default function EventCountdownBadge({ date, startTime, className = "" }) {
  const { t } = useTranslation(["eventExperience"]);
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(date, startTime));

  useEffect(() => {
    const interval = window.setInterval(() => setRemainingMs(getRemainingMs(date, startTime)), 60000);
    return () => window.clearInterval(interval);
  }, [date, startTime]);

  if (remainingMs === null || remainingMs <= 0 || remainingMs > DAY_MS) return null;

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${className}`}
    >
      <IconClock size={12} />
      {t("eventExperience:card.countdown.startsIn", { hours, minutes })}
    </motion.span>
  );
}
