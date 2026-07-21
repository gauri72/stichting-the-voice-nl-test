import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function CalendarDayTooltip({ dayData }) {
  const { t } = useTranslation(["eventExperience"]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute left-1/2 top-full z-30 mt-1 hidden w-48 -translate-x-1/2 rounded-lg border border-evx-border bg-evx-surface-elevated p-2 text-xs shadow-lg sm:block"
      role="tooltip"
    >
      {(dayData.events || []).slice(0, 4).map((e) => (
        <p key={e.id} className="truncate py-0.5 text-evx-text">
          {e.startTime ? `${e.startTime} · ` : ""}
          {e.title}
        </p>
      ))}
      {dayData.count > 4 ? (
        <p className="text-evx-text-muted">
          {t("eventExperience:calendar.tooltip.more", { count: dayData.count - 4 })}
        </p>
      ) : null}
    </motion.div>
  );
}
