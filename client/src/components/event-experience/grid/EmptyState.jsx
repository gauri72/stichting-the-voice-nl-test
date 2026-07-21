import { motion } from "framer-motion";
import { IconCalendarOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function EmptyState({ onClearFilters }) {
  const { t } = useTranslation(["eventExperience"]);
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
      <p className="text-lg font-bold text-evx-heading">{t("eventExperience:grid.emptyState.title")}</p>
      <p className="text-sm text-evx-text-muted">{t("eventExperience:grid.emptyState.body")}</p>
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-2 rounded-full bg-evx-accent px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          {t("eventExperience:grid.emptyState.clearFilters")}
        </button>
      ) : null}
    </motion.div>
  );
}
